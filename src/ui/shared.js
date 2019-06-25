import { timingSafeEqual } from 'crypto';

export default (App) => ({
  el: '#app',
  render: h => h(App),
  mounted() {
    this.$on('savePreferences', async preferences => {
      try {
        await browser.runtime.sendMessage({
          method: 'savePreferences',
          payload: {
            preferences
          }
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('error while saving preferences', error);
        showError('Error while saving preferences!');
      }
    });
  }
});

window.showMessage = (message, keepOpen = false) => {
  const messageBox = $('#message');
  messageBox.html(message);
  messageBox.addClass('positive');
  messageBox.removeClass('negative');
  messageBox.removeClass('hidden');
  if (keepOpen) {
    return;
  }
  setTimeout(() => {
    messageBox.addClass('hidden');
  }, 3000);
};

window.showError = (error) => {
  const messageBox = $('#message');
  messageBox.html(error);
  messageBox.addClass('negative');
  messageBox.removeClass('positive');
  messageBox.removeClass('hidden');
};

window.showPreferencesError = (error) => {
  if (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    $('#preferenceserrordesc').html(`<br><br>
      The following error was observed, would be really helpful
      if you could file an <a href="https://github.com/stoically/temporary-containers/issues" target="_blank">issue on GitHub</a> with it:
      <br><br>
      ${error.toString()}
    `);
  }
  $('#preferenceserror')
    .modal({
      closable: false
    })
    .modal('show');
};

window.saveIsolationGlobalPreferences = async (event) => {
  event.preventDefault();

  preferences.isolation.global.navigation.action = document.querySelector('#isolationGlobal').value;
  preferences.isolation.global.mouseClick = {
    middle: {
      action: document.querySelector('#isolationGlobalMouseClickMiddle').value,
      container: document.querySelector('#linkClickGlobalMiddleCreatesContainer').value
    },
    ctrlleft: {
      action: document.querySelector('#isolationGlobalMouseClickCtrlLeft').value,
      container: document.querySelector('#linkClickGlobalCtrlLeftCreatesContainer').value
    },
    left: {
      action: document.querySelector('#isolationGlobalMouseClickLeft').value,
      container: document.querySelector('#linkClickGlobalLeftCreatesContainer').value
    }
  };

  preferences.isolation.global.excluded = isolationGlobalExcludedDomains;

  preferences.isolation.global.excludedContainers = {};
  const excludedContainers = $('#isolationGlobalExcludeContainers').dropdown('get values');
  if (excludedContainers) {
    excludedContainers.map(excludeContainer => {
      preferences.isolation.global.excludedContainers[excludeContainer] = {};
    });
  }

  preferences.isolation.mac.action = document.querySelector('#isolationMac').value;

  await savePreferences();
};

window.isolationDomainAddRule = async () => {
  const domainPattern = document.querySelector('#isolationDomainPattern').value;

  preferences.isolation.domain[domainPattern] = {
    always: {
      action: document.querySelector('#isolationDomainAlways').value,
      allowedInPermanent: document.querySelector('#isolationDomainAlwaysAllowedInPermanent').checked
    },
    navigation: {
      action: document.querySelector('#isolationDomainNavigation').value
    },
    mouseClick: {
      middle: {
        action: document.querySelector('#isolationDomainMouseClickMiddle').value
      },
      ctrlleft: {
        action: document.querySelector('#isolationDomainMouseClickCtrlLeft').value
      },
      left: {
        action: document.querySelector('#isolationDomainMouseClickLeft').value
      }
    },
    excluded: isolationDomainExcludedDomains
  };

  await savePreferences();
  updateIsolationDomains();
};

window.isolationDomainEditRule = (domainPattern) => {
  domainPattern = decodeURIComponent(domainPattern);
  document.querySelector('#isolationDomainPattern').value = domainPattern;

  if (preferences.isolation.domain[domainPattern]) {
    const domainRules = preferences.isolation.domain[domainPattern];

    $('#isolationDomainAlways').dropdown('set selected', domainRules.always.action);
    document.querySelector('#isolationDomainAlwaysAllowedInPermanent').checked = domainRules.always.allowedInPermanent;
    $('#isolationDomainNavigation').dropdown('set selected', domainRules.navigation.action);
    $('#isolationDomainMouseClickMiddle').dropdown('set selected', domainRules.mouseClick.middle.action);
    $('#isolationDomainMouseClickCtrlLeft').dropdown('set selected', domainRules.mouseClick.ctrlleft.action);
    $('#isolationDomainMouseClickLeft').dropdown('set selected', domainRules.mouseClick.left.action);
    $('#isolationPerDomainAccordion').accordion('open', 0);
    $('#isolationPerDomainAccordion').accordion('open', 1);
    $('#isolationPerDomainAccordion').accordion('open', 2);
    $('#isolationPerDomainAccordion').accordion('open', 3);

    isolationDomainExcludedDomains = domainRules.excluded;
    updateIsolationDomainExcludeDomains();
  }
};

window.isolationDomainRulesClickEvent = false;
window.updateIsolationDomains = () => {
  const isolationDomainRules = $('#isolationDomains');
  const domainRules = Object.keys(preferences.isolation.domain);
  if (domainRules.length) {
    isolationDomainRules.html('');
    domainRules.map((domainPattern) => {
      const el = $(`<div class="item" id="${encodeURIComponent(domainPattern)}">` +
        `<span id="infoDomainRule" href="#">${domainPattern} <i class="icon-info-circled"></i></span> ` +
        '<a href="#" id="editDomainRule" data-tooltip="Edit"><i class="icon-pencil"></i>️</a> ' +
        '<a href="#" id="removeDomainPattern" data-tooltip="Remove (no confirmation)" ' +
        '><i class="icon-trash-empty"></i>️</a></div>');
      isolationDomainRules.append(el);

      const domainRuleTooltip =
        '<div style="width:200%;">' +
        `<strong>Always</strong>: ${preferences.isolation.domain[domainPattern].always.action} <br>` +
        `> <strong>Permanent allowed</strong>: ${preferences.isolation.domain[domainPattern].always.allowedInPermanent} <br><br>` +
        `<strong>Navigation</strong>: ${preferences.isolation.domain[domainPattern].navigation.action} <br><br>` +
        '<strong>Mouse Clicks</strong><br>' +
        `Middle: ${preferences.isolation.domain[domainPattern].mouseClick.middle.action} <br>` +
        `Ctrl+Left: ${preferences.isolation.domain[domainPattern].mouseClick.ctrlleft.action} <br>` +
        `Left: ${preferences.isolation.domain[domainPattern].mouseClick.left.action}</div><br>` +
        '<strong>Excluded Target/Link Domains</strong>:<br>' +
        (preferences.isolation.domain[domainPattern].excluded &&
         Object.keys(preferences.isolation.domain[domainPattern].excluded).length > 0 ?
          `${Object.keys(preferences.isolation.domain[domainPattern].excluded).join('<br>')}` :
          'No Target/Link Domains excluded');
      el.find('#infoDomainRule').popup({
        html: domainRuleTooltip,
        inline: true
      });
    });

    if (!isolationDomainRulesClickEvent) {
      isolationDomainRules.on('click', async (event) => {
        event.preventDefault();
        const targetId = $(event.target).parent().attr('id');
        const domainPattern = $(event.target).parent().parent().attr('id');
        if (targetId === 'editDomainRule') {
          isolationDomainEditRule(domainPattern);
          return;
        }
        if (targetId === 'removeDomainPattern') {
          delete preferences.isolation.domain[decodeURIComponent(domainPattern)];
          // TODO show "rule deleted" instead of "preferences saved"
          await savePreferences();
          updateIsolationDomains();
        }
      });
      isolationDomainRulesClickEvent = true;
    }
  } else {
    isolationDomainRules.html('No Domains added');
  }
};

window.isolationGlobalAddExcludeDomainRule = () => {
  const excludeDomainPattern = document.querySelector('#isolationGlobalExcludeDomainPattern').value;
  if (!excludeDomainPattern) {
    $('#isolationGlobalExcludeDomainPatternDiv').addClass('error');
    return;
  }
  $('#isolationGlobalExcludeDomainPatternDiv').removeClass('error');
  isolationGlobalExcludedDomains[excludeDomainPattern] = {};
  updateIsolationGlobalExcludeDomains();
};


window.isolationDomainAddExcludeDomainRule = () => {
  const excludeDomainPattern = document.querySelector('#isolationDomainExcludeDomainPattern').value;
  if (!excludeDomainPattern) {
    $('#isolationDomainExcludeDomainPatternDiv').addClass('error');
    return;
  }
  $('#isolationDomainExcludeDomainPatternDiv').removeClass('error');
  isolationDomainExcludedDomains[excludeDomainPattern] = {};
  updateIsolationDomainExcludeDomains();
};


window.isolationGlobalExcludedDomains = {};
window.isolationGlobalExcludeDomainPatternsClickEvent = false;
window.updateIsolationGlobalExcludeDomains = () => {
  const isolationGlobalExcludeDomainPatternsDiv = $('#isolationGlobalExcludedDomains');
  const isolationGlobalExcludeDomainPatterns = Object.keys(isolationGlobalExcludedDomains);
  if (!isolationGlobalExcludeDomainPatterns.length) {
    isolationGlobalExcludeDomainPatternsDiv.html('No domains excluded');
    return;
  }
  isolationGlobalExcludeDomainPatternsDiv.html('');
  isolationGlobalExcludeDomainPatterns.map((domainPattern) => {
    const el = $(`<div class="item" id="${encodeURIComponent(domainPattern)}">` +
      domainPattern +
      ' <a href="#" id="removeDomainPattern" data-tooltip="Remove (no confirmation)" ' +
      '><i class="icon-trash-empty"></i>️</a></div>');
    isolationGlobalExcludeDomainPatternsDiv.append(el);
  });

  if (!isolationGlobalExcludeDomainPatternsClickEvent) {
    isolationGlobalExcludeDomainPatternsDiv.on('click', async (event) => {
      event.preventDefault();
      const targetId = $(event.target).parent().attr('id');
      const domainPattern = $(event.target).parent().parent().attr('id');
      if (targetId === 'removeDomainPattern') {
        delete isolationGlobalExcludedDomains[decodeURIComponent(domainPattern)];
        updateIsolationGlobalExcludeDomains();
      }
    });
    isolationGlobalExcludeDomainPatternsClickEvent = true;
  }
};


window.isolationDomainExcludedDomains = {};
window.isolationDomainExcludeDomainPatternsClickEvent = false;
window.updateIsolationDomainExcludeDomains = () => {
  const isolationDomainExcludeDomainPatternsDiv = $('#isolationDomainExcludedDomains');
  const isolationDomainExcludeDomainPatterns = Object.keys(isolationDomainExcludedDomains);
  if (!isolationDomainExcludeDomainPatterns.length) {
    isolationDomainExcludeDomainPatternsDiv.html('No domains excluded');
    return;
  }
  isolationDomainExcludeDomainPatternsDiv.html('');
  isolationDomainExcludeDomainPatterns.map((domainPattern) => {
    const el = $(`<div class="item" id="${encodeURIComponent(domainPattern)}">` +
      domainPattern +
      ' <a href="#" id="removeDomainPattern" data-tooltip="Remove (no confirmation)" ' +
      '><i class="icon-trash-empty"></i>️</a></div>');
    isolationDomainExcludeDomainPatternsDiv.append(el);
  });

  if (!isolationDomainExcludeDomainPatternsClickEvent) {
    isolationDomainExcludeDomainPatternsDiv.on('click', async (event) => {
      event.preventDefault();
      const targetId = $(event.target).parent().attr('id');
      const domainPattern = $(event.target).parent().parent().attr('id');
      if (targetId === 'removeDomainPattern') {
        delete isolationDomainExcludedDomains[decodeURIComponent(domainPattern)];
        updateIsolationDomainExcludeDomains();
      }
    });
    isolationDomainExcludeDomainPatternsClickEvent = true;
  }
};



window.updateStatistics = async () => {
  const storage = await browser.storage.local.get('statistics');
  if (!storage.statistics) {
    showError('Error while loading statistics.');
    return;
  }
  $('#containersDeleted').html(storage.statistics.containersDeleted);
  $('#cookiesDeleted').html(storage.statistics.cookiesDeleted);
  $('#cacheDeleted').html(formatBytes(storage.statistics.cacheDeleted, 0));

  $('#statisticsStartTime').html(storage.statistics.startTime);

  $('#deletesHistoryContainersDeleted').html(storage.statistics.deletesHistory.containersDeleted);
  $('#deletesHistoryCookiesDeleted').html(storage.statistics.deletesHistory.cookiesDeleted);
  $('#deletesHistoryUrlsDeleted').html(storage.statistics.deletesHistory.urlsDeleted);
};

window.formatBytes = (bytes, decimals) => {
  // https://stackoverflow.com/a/18650828
  if (bytes == 0) return '0 Bytes';
  let k = 1024,
    dm = decimals === undefined ? 2 : decimals,
    sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
};
