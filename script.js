
function waitForElements(selector, callback, timeout = 10000) {
  const startTime = Date.now();
  const interval = setInterval(() => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      clearInterval(interval);
      callback(elements);
    }
    if (Date.now() - startTime > timeout) {
      clearInterval(interval);
      console.error(`Timeout: Élément(s) "${selector}" introuvable(s).`);
    }
  }, 100);
}

function extractItemData(itemBoxContent) {

  const data = {};
  const mainName = itemBoxContent.querySelector(".itemName span.lc");
  if (mainName) {
    data.mainName = mainName.textContent.trim();
  }

  const typeLine = itemBoxContent.querySelector(".itemName.typeLine span.lc");
  if (typeLine) {
    data.type = typeLine.textContent.trim();
  }

  const properties = [];
  itemBoxContent.querySelectorAll(".property").forEach((prop) => {
    const field = prop.dataset.field || "unknown";
    const value = prop.textContent.trim();
    properties.push({ field, value });
  });
  data.properties = properties;

  const implicitMods = [];
  itemBoxContent.querySelectorAll(".implicitMod").forEach((mod) => {
    const modData = {
      label: mod.querySelector(".lc.s")?.textContent.trim(),
      value: mod.querySelector(".lc.r .d")?.textContent.trim(),
    };
    implicitMods.push(modData);
  });
  data.implicitMods = implicitMods;

  const explicitMods = [];
  itemBoxContent.querySelectorAll(".explicitMod").forEach((mod) => {
    const modData = {
      label: mod.querySelector(".lc.s")?.textContent.trim(),
      value: mod.querySelector(".lc.r .d")?.textContent.trim(),
    };
    explicitMods.push(modData);
  });
  data.explicitMods = explicitMods;

  const itemLevel = itemBoxContent.querySelector(".itemLevel span.lc.s");
  if (itemLevel) {
    data.itemLevel = itemLevel.textContent.trim();
  }

  const requirements = [];
  const reqLine = itemBoxContent.querySelector(".requirements span.lc");
  if (reqLine) {
    requirements.push(reqLine.textContent.trim());
  }
  data.requirements = requirements;

  const runeMods = [];
  itemBoxContent.querySelectorAll(".runeMod .lc.s").forEach((rune) => {
    runeMods.push(rune.textContent.trim());
  });

  if (runeMods.length > 0) {
    data.runeMod = runeMods.map(rune => `- ${rune}`).join('\n');
  }

  const corrupted = itemBoxContent.querySelector(".unmet .lc");
  if (corrupted) {
    data.corrupted = corrupted.textContent.trim();
  }

  const row = itemBoxContent.closest('.row');
  const priceDiv = row ? row.querySelector('.right .price') : null;

  if (priceDiv) {

    const spans = priceDiv.querySelectorAll('span');
    const quantity = spans[0]; 
    const multiplySymbol = spans[1];
    const currencyText = spans[2];
    if (quantity && multiplySymbol && currencyText) {
      data.price = `${quantity.textContent.trim()}`;
    }
  }

  const iconDiv = row ? row.querySelector('.left .icon') : null;

  if (iconDiv) {
    const img = iconDiv.querySelector('img');
    if (img) {
      data.iconUrl = img.src;
    }
  }

  return data;
}


function sendToDiscord(itemData) {

  chrome.storage.sync.get(['webhookUrl', 'roleId'], (data) => {
    const webhookUrl = data.webhookUrl;
    const roleId = data.roleId;
    if (!webhookUrl) {
      alert('Veuillez configurer le Webhook URL dans l’extension.');
      return;
    }

    if (!roleId) {
      alert('Veuillez configurer l\'ID du rôle dans l’extension.');
      return;
    }
    const currentUrl = window.location.href;
    const embed = {
      description: `
        :loudspeaker: **Ping for POE 2 Role:** <@&${roleId}>\n
         **Type:** ${itemData.type}\n
        **Item Level:** ${itemData.itemLevel}\n
        **Requirements:** ${itemData.requirements.join(' | ')}\n
        **Properties:**
        ${itemData.properties.map(prop => `- ${prop.value}`).join('\n')}
        ${itemData.runeMod ? `\n**Rune:**\n${itemData.runeMod}` : ''}
        ${itemData.implicitMods && itemData.implicitMods.length > 0 ? `\n**Implicit Mods:**\n${itemData.implicitMods.map(mod => `- ${mod.label}: ${mod.value}`).join('\n')}` : ''}\n
        \n**Explicit Mods:**\n${itemData.explicitMods.map(mod => `- ${mod.label}: ${mod.value}`).join('\n')}
        ${itemData.corrupted ? `\n\n**${itemData.corrupted}**` : ''}\n
        **${itemData.price}**\n
        \n**Filter URL:** ${currentUrl}
      `,
      image: {
        url: itemData.iconUrl,
      },
      footer: {
        text: 'PoE2 Discord notification',
      },
    };

    const message = {
      embeds: [embed],
    };

    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })
    .then(response => {
      if (response.ok) {
        console.log('Message envoyé avec succès à Discord.');
      } else {
        console.error('Erreur lors de l\'envoi du message à Discord.');
      }
    })
    .catch(error => {
      console.error('Erreur réseau:', error);
    });
  });
}

setTimeout(() => {
  
      waitForElements(".itemBoxContent", (itemBoxes) => {
        setTimeout(() => {
          document.querySelectorAll(".right .custom-btn").forEach((button) => {
            startCheckButtonOnFrames(); 
          });
        }, 1000);
        

        itemBoxes.forEach((itemBoxContent) => {
          const button = document.createElement('button');
          button.classList.add('custom-btn');
          button.style.marginTop = '2px';
          button.style.marginLeft = '10px';
          button.style.backgroundColor = '#222';
          button.style.border = '1px solid #5d5151';
          button.style.color = '#e9cf9f';
          button.style.fontSize = '12px';
          button.textContent = "Send to discord";
          
          const rightDiv = itemBoxContent.closest('.row').querySelector('.right');
          if (rightDiv) {
            rightDiv.appendChild(button);
          }

          button.addEventListener("click", () => {
            const itemData = extractItemData(itemBoxContent);
            sendToDiscord(itemData);
          });
        });
      });
  
}, 500);


function checkAndAddButton() {
  
  const itemBoxes = document.querySelectorAll(".right");
  
  itemBoxes.forEach((itemBoxContent) => {

    if (!itemBoxContent.querySelector('.custom-btn')) {
      const button = document.createElement('button');
      button.classList.add('custom-btn');
      button.style.marginTop = '2px';
      button.style.marginLeft = '10px';
      button.style.backgroundColor = '#222';
      button.style.border = '1px solid #5d5151';
      button.style.color = '#e9cf9f';
      button.style.fontSize = '12px';
      button.textContent = "Send to discord";

      const rightDiv = itemBoxContent.closest('.row').querySelector('.right');
      if (rightDiv) {
        rightDiv.appendChild(button);
      }
      
      button.addEventListener("click", () => {
    
        const itemDataBox = itemBoxContent.closest('.row').querySelector('.middle .itemBoxContent');
        const itemData = extractItemData(itemDataBox);
        sendToDiscord(itemData);
      });
    }
  });
}


function startCheckButtonOnFrames() {
  function check() {
    checkAndAddButton();
    requestAnimationFrame(check);
  }

  requestAnimationFrame(check);
}