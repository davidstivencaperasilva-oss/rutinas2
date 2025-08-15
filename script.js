const BACKEND_URL = "https://rutinas-v42p.onrender.com";

document.getElementById("routineForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
        height: document.getElementById("height").value,
        weight: document.getElementById("weight").value,
        sex: document.getElementById("sex").value,
        goal: document.getElementById("goal").value,
        days: document.getElementById("days").value,
        hours: document.getElementById("hours").value
    };

    const response = await fetch(`${BACKEND_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    const result = await response.json();
    displayRoutine(result.routine);
});

function displayRoutine(routine) {
    const container = document.getElementById("routineOutput");
    container.innerHTML = "<h2>Tu rutina:</h2>";
    const list = document.createElement("ul");
    routine.forEach(exercise => {
        const li = document.createElement("li");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.addEventListener("change", () => {
            localStorage.setItem(exercise, checkbox.checked);
        });
        checkbox.checked = localStorage.getItem(exercise) === "true";
        li.appendChild(checkbox);
        li.appendChild(document.createTextNode(" " + exercise));
        list.appendChild(li);
    });
    container.appendChild(list);
}