document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded');
    const webhookInput = document.getElementById('webhookUrl');
    const saveButton = document.getElementById('save');
    const status = document.getElementById('status');
    const roleIdInput = document.getElementById('roleId');

    chrome.storage.sync.get(['webhookUrl', 'roleId'], (data) => {
        if (data.webhookUrl) {
            webhookInput.value = data.webhookUrl;
        }
        if (data.roleId) {
            roleIdInput.value = data.roleId;
        }
    });

    const saveData = () => {
        const webhookUrl = webhookInput.value.trim();
        const roleId = roleIdInput.value.trim();

        if (webhookUrl) {
            chrome.storage.sync.set({ webhookUrl }, () => {
                status.textContent = 'Saved successfully!';
                setTimeout(() => (status.textContent = ''), 2000);
            });
        } else {
            status.textContent = 'Please enter a valid URL.';
        }

        if (roleId) {
            chrome.storage.sync.set({ roleId }, () => {
                status.textContent = 'Saved successfully!';
                setTimeout(() => (status.textContent = ''), 2000);
            });
        } else {
            status.textContent = 'Please enter a valid role ID.';
        }
    };

    webhookInput.addEventListener('change', saveData);
    roleIdInput.addEventListener('change', saveData);

    saveButton.addEventListener('click', saveData);
});
