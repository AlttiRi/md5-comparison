console.log = getHtmlLog(console.log);
console.warn = getHtmlLog(console.warn, "warning");
console.error = getHtmlLog(console.error, "error");

function getHtmlLog(func, className) {
    globalThis[func.name] = func;
    return function() {
        func(...arguments);

        const entry = document.createElement("div");
        entry.classList.add("console-entry");
        // entry.style.maxWidth = "300px";
        if (className) {
            entry.classList.add(className);
        }

        for (const argument of arguments) {
            const str = toString(argument);

            const block = document.createElement("pre");
            block.textContent = str;
            entry.append(block);
        }

        const root = document.querySelector("#console_log-to-html") || document.querySelector("body");

        root.append(entry);
        root.append(document.createElement("hr"));
    };
}

function toString(argument) {
    if (typeof argument !== "object") {
        return argument;
    }

    try {
        function replacer(key, value) {
            return value;
        }
        return JSON.stringify(argument, replacer, "  ");
    } catch(e) {
        console.error(e);
    }
}