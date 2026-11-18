(() => {
    const form = document.getElementById('inquiry-form');
    if (!form) return;

    const status = form.querySelector('.form-status');
    const submit = form.querySelector('.form-submit');
    const types = form.querySelectorAll('input[name="project_type"]');
    const PLACEHOLDER_KEY = 'YOUR_WEB3FORMS_ACCESS_KEY';

    const say = (text) => {
        status.textContent = text;
        status.hidden = false;
    };

    // At least one project type has to be ticked; the browser has no native
    // rule for "one of these checkboxes".
    const syncTypes = () => {
        const any = [...types].some((box) => box.checked);
        types[0].setCustomValidity(any ? '' : 'Choose at least one project type.');
    };
    types.forEach((box) => box.addEventListener('change', syncTypes));
    syncTypes();

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        syncTypes();
        if (!form.reportValidity()) return;

        const data = new FormData(form);
        if (data.get('access_key') === PLACEHOLDER_KEY) {
            say('This form is not connected yet. Please email me directly.');
            return;
        }

        const body = Object.fromEntries(data);
        body.project_type = data.getAll('project_type').join(', ');

        submit.disabled = true;
        say('Sending...');
        try {
            const res = await fetch(form.action, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(body)
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message);
            form.reset();
            syncTypes();
            say('Thank you. Your message has been sent, and I will reply by email.');
        } catch (err) {
            say('Something went wrong. Please try again, or email me directly.');
        } finally {
            submit.disabled = false;
        }
    });
})();
