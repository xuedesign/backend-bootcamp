/** 只有該週已解鎖時，才把講義從 template 放進畫面。 */
export function initLessonPage() {
  const lesson = document.querySelector(".lesson[data-week]");
  const template = document.querySelector("#handout");
  const stage = document.querySelector(".lesson .stage");
  if (!lesson || !template || !stage) return;

  const week = lesson.dataset.week;
  const open = document.documentElement.classList.contains(`week-open-${week}`);
  if (!open) return;

  stage.replaceChildren(template.content.cloneNode(true));
}

export function initQuizPage(onPass) {
  const quiz = document.querySelector(".quiz[data-week]");
  const template = document.querySelector("#quiz-source");
  const stage = document.querySelector(".quiz .stage");
  if (!quiz || !template || !stage) return;

  const week = Number(quiz.dataset.week);
  const open = document.documentElement.classList.contains(`week-open-${week}`);
  if (!open) return;

  const payload = template.content.querySelector("script")?.textContent;
  if (!payload) return;
  const data = JSON.parse(payload);
  stage.replaceChildren(renderQuiz(data, week, onPass));
}

function renderQuiz(data, week, onPass) {
  const form = document.createElement("form");
  form.className = "quiz-form";
  form.noValidate = true;

  const list = document.createElement("ol");
  list.className = "quiz-list";
  data.questions.forEach((question, index) => {
    const item = document.createElement("li");
    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = `${index + 1}. ${question.prompt}`;
    fieldset.append(legend);
    question.choices.forEach((choice, choiceIndex) => {
      const label = document.createElement("label");
      label.className = "choice";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = question.id;
      input.value = String(choiceIndex);
      input.required = true;
      const span = document.createElement("span");
      span.textContent = choice;
      label.append(input, span);
      fieldset.append(label);
    });
    const explain = document.createElement("p");
    explain.className = "explain";
    explain.hidden = true;
    fieldset.append(explain);
    item.append(fieldset);
    list.append(item);
  });

  const status = document.createElement("p");
  status.className = "quiz-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "button button--primary";
  submit.textContent = "交卷";

  const retry = document.createElement("button");
  retry.type = "button";
  retry.className = "button";
  retry.textContent = "再考一次";
  retry.hidden = true;

  form.append(list, status, submit, retry);

  const grade = () => {
    const picks = data.questions.map((question) => {
      const fieldset = form.querySelector(`input[name="${CSS.escape(question.id)}"]`)?.closest("fieldset");
      const selected = form.querySelector(`input[name="${CSS.escape(question.id)}"]:checked`);
      return { question, fieldset, selected };
    });
    const missing = picks.find((item) => item.fieldset && !item.selected);
    if (missing) {
      picks.forEach((item) => item.fieldset?.classList.toggle("is-missing", !item.selected));
      status.textContent = "還有題目沒選。選完再交卷。";
      missing.fieldset.querySelector("input")?.focus();
      return null;
    }

    let correct = 0;
    picks.forEach(({ question, fieldset, selected }) => {
      if (!fieldset || !selected) return;
      fieldset.classList.remove("is-missing");
      const picked = Number(selected.value);
      [...fieldset.querySelectorAll(".choice")].forEach((label, choiceIndex) => {
        label.classList.toggle("is-answer", choiceIndex === question.answer);
        label.classList.toggle("is-picked", choiceIndex === picked);
      });
      const explain = fieldset.querySelector(".explain");
      explain.hidden = false;
      explain.textContent = question.explain;
      if (picked === question.answer) {
        correct += 1;
        fieldset.classList.add("is-correct");
      } else {
        fieldset.classList.add("is-wrong");
      }
    });

    const total = data.questions.length;
    const passed = correct / total >= 0.8;
    status.textContent = passed
      ? `答對 ${correct} / ${total} 題，通過了。`
      : `答對 ${correct} / ${total} 題，這次還沒到 80%。可以再考一次。`;
    submit.hidden = true;
    retry.hidden = false;
    form.querySelectorAll("input").forEach((input) => {
      input.disabled = true;
    });
    return { correct, total, passed };
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = grade();
    if (!result) return;
    onPass({ week, ...result });
  });

  retry.addEventListener("click", () => {
    form.querySelectorAll("fieldset").forEach((fieldset) => {
      fieldset.classList.remove("is-correct", "is-wrong", "is-missing");
    });
    form.querySelectorAll(".choice").forEach((label) => {
      label.classList.remove("is-answer", "is-picked");
    });
    form.querySelectorAll(".explain").forEach((node) => {
      node.hidden = true;
      node.textContent = "";
    });
    form.querySelectorAll("input").forEach((input) => {
      input.disabled = false;
      input.checked = false;
    });
    status.textContent = "";
    submit.hidden = false;
    retry.hidden = true;
  });

  return form;
}
