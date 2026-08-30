/* =========================================================
   UNGOC WEBSITE DATA CLIENT
   ========================================================= */


/*
 * Replace this with the deployed Google Apps Script
 * Web App /exec URL.
 */

const API_URL =
  'https://script.google.com/macros/s/AKfycbwXJVtvjGwk1ieRqMDM5wGI0vRYmEoWIQumiXlkF_HBmEdwyHZwABaHNnaTp5puvwvWvw/exec';


/* =========================================================
   STATE
   ========================================================= */

let state = {
  settings: {},
  personnel: [],
  operations: [],
  announcements: [],
  morphs: []
};

let activeDivision = 'All';

let operationStatus = 'All';

let currentCommand = '';


/* =========================================================
   HELPERS
   ========================================================= */

const $ = id =>
  document.getElementById(id);


const clean = value =>
  String(value ?? '').trim();


const enabled = value =>
  [
    'true',
    'yes',
    '1',
    'active'
  ].includes(
    clean(value).toLowerCase()
  );


const escapeHTML = value =>
  clean(value).replace(
    /[&<>'"]/g,
    character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    })[character]
  );


const formatDate = value => {
  const parsed =
    new Date(value);

  if (isNaN(parsed)) {
    return clean(value);
  }

  return parsed.toLocaleDateString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }
  );
};


/* =========================================================
   DETERMINE CURRENT PAGE
   ========================================================= */

function getPage() {

  const filename =
    location.pathname
      .split('/')
      .pop()
      .toLowerCase();


  if (
    filename === 'operations.html'
  ) {
    return 'operations';
  }


  if (
    filename === 'personnel.html'
  ) {
    return 'personnel';
  }


  if (
    filename === 'announcements.html'
  ) {
    return 'announcements';
  }


  if (
    filename === 'morphs.html'
  ) {
    return 'morphs';
  }


  if (
    filename === 'system.html'
  ) {
    return 'system';
  }


  return 'dashboard';
}


/* =========================================================
   JSONP REQUEST
   ========================================================= */

function jsonp(url) {

  return new Promise(
    (resolve, reject) => {

      const callback =
        `ungoc_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2)}`;


      const script =
        document.createElement('script');


      const timeout =
        setTimeout(() => {

          cleanup();

          reject(
            new Error(
              'Coalition uplink timed out.'
            )
          );

        }, 12000);


      function cleanup() {

        clearTimeout(timeout);

        delete window[callback];

        script.remove();
      }


      window[callback] =
        data => {

          cleanup();

          resolve(data);
        };


      script.onerror = () => {

        cleanup();

        reject(
          new Error(
            'Coalition uplink unavailable.'
          )
        );

      };


      script.src =
        `${url}${url.includes('?')
          ? '&'
          : '?'}callback=${callback}`;


      document.head.appendChild(
        script
      );
    }
  );
}


/* =========================================================
   LOAD DATA
   ========================================================= */

async function load() {

  const page =
    getPage();


  if (
    !API_URL ||
    !API_URL.startsWith(
      'https://script.google.com/'
    )
  ) {

    setConnectionStatus(
      'NOT CONFIGURED'
    );

    return;
  }


  try {

    state =
      await jsonp(
        `${API_URL}?page=${page}`
      );


    renderPage();


    setConnectionStatus(
      'ONLINE'
    );


    if ($('lastSync')) {

      $('lastSync').textContent =
        new Date().toLocaleTimeString(
          [],
          {
            hour: '2-digit',
            minute: '2-digit'
          }
        );
    }

  } catch (error) {

    console.error(error);

    setConnectionStatus(
      'OFFLINE'
    );

    showConnectionError();
  }
}


/* =========================================================
   CONNECTION STATUS
   ========================================================= */

function setConnectionStatus(status) {

  if ($('syncStatus')) {
    $('syncStatus').textContent =
      status;
  }
}


/* =========================================================
   CONNECTION ERROR
   ========================================================= */

function showConnectionError() {

  const elements = [
    'announcementsGrid',
    'operationsList',
    'personnelGrid',
    'settingsGrid'
  ];


  elements.forEach(id => {

    const element = $(id);

    if (!element) {
      return;
    }

    element.innerHTML = `
      <p class="empty">
        Coalition network unavailable.
        Verify the operational uplink.
      </p>
    `;
  });
}


/* =========================================================
   PAGE RENDER
   ========================================================= */

function renderPage() {

  applySettings();


  const page =
    getPage();


  switch (page) {

    case 'dashboard':
      renderDashboard();
      break;

    case 'operations':
      renderOperationsPage();
      break;

    case 'personnel':
      renderPersonnelPage();
      break;

    case 'announcements':
      renderAnnouncementsPage();
      break;

    case 'morphs':
      renderMorphPage();
      break;

    case 'system':
      renderSystemPage();
      break;
  }
}


/* =========================================================
   SETTINGS
   ========================================================= */

function applySettings() {

  const settings =
    state.settings || {};


  const siteName =
    settings.siteName ||
    'United Nations Global Occult Coalition';


  document.title =
    `${siteName} // Coalition Command`;


  if ($('heroMessage')) {

    $('heroMessage').textContent =
      settings.heroMessage ||
      'Coalition operational intelligence network.';
  }


  if ($('theater')) {

    $('theater').textContent =
      settings.theater ||
      'SCP:RP';
  }


  if ($('threatCondition')) {

    $('threatCondition').textContent =
      settings.threatCondition ||
      'NOMINAL';
  }
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function renderDashboard() {

  const personnel =
    state.personnel || [];


  const operations =
    state.operations || [];


  const announcements =
    state.announcements || [];


  if ($('metricPersonnel')) {

    $('metricPersonnel').textContent =
      personnel.filter(
        person =>
          clean(
            person.status
          ).toLowerCase() !==
          'inactive'
      ).length;
  }


  if ($('metricOperations')) {

    $('metricOperations').textContent =
      operations.length;
  }


  if ($('metricAnnouncements')) {

    $('metricAnnouncements').textContent =
      announcements.length;
  }


  renderAnnouncements(
    announcements.slice(0, 6)
  );


  renderOperations(
    operations.slice(0, 12)
  );
}


/* =========================================================
   OPERATIONS PAGE
   ========================================================= */

function renderOperationsPage() {

  const operations =
    state.operations || [];


  populateOperationFilter(
    operations
  );


  renderOperations(
    filterOperations(
      operations
    )
  );


  const filter =
    $('operationFilter');


  if (filter) {

    filter.onchange = () => {

      operationStatus =
        filter.value;

      renderOperations(
        filterOperations(
          operations
        )
      );
    };
  }
}


/* =========================================================
   OPERATION FILTER
   ========================================================= */

function populateOperationFilter(
  operations
) {

  const filter =
    $('operationFilter');


  if (!filter) {
    return;
  }


  const statuses = [
    'All',
    ...new Set(
      operations
        .map(
          operation =>
            clean(
              operation.status
            )
        )
        .filter(Boolean)
    )
  ];


  filter.innerHTML =
    statuses
      .map(status => `
        <option value="${escapeHTML(status)}">
          ${escapeHTML(
            status === 'All'
              ? 'All Statuses'
              : status
          )}
        </option>
      `)
      .join('');


  filter.value =
    operationStatus;
}


/* =========================================================
   FILTER OPERATIONS
   ========================================================= */

function filterOperations(
  operations
) {

  if (
    operationStatus ===
    'All'
  ) {
    return operations;
  }


  return operations.filter(
    operation =>
      clean(
        operation.status
      ) === operationStatus
  );
}


/* =========================================================
   RENDER OPERATIONS
   ========================================================= */

function renderOperations(
  items
) {

  const container =
    $('operationsList');


  if (!container) {
    return;
  }


  if (!items.length) {

    container.innerHTML = `
      <p class="empty">
        No operational records have
        been published.
      </p>
    `;

    return;
  }


  container.innerHTML =
    items
      .map(operation => {

        const status =
          clean(
            operation.status
          ).toLowerCase();


        return `
          <article class="operation">

            <div class="date">
              ${formatDate(
                operation.date
              )}
            </div>

            <div>

              <h3>
                ${escapeHTML(
                  operation.operationName ||
                  'Unnamed Operation'
                )}
              </h3>

              <small>
                ${escapeHTML(
                  operation.type ||
                  'Intervention'
                )}
                ·
                ${escapeHTML(
                  operation.location ||
                  'Classified'
                )}
              </small>

            </div>

            <p>
              ${escapeHTML(
                operation.lead ||
                'Unassigned'
              )}
            </p>

            <p>
              ${escapeHTML(
                operation.summary ||
                'No operational summary provided.'
              )}
            </p>

            <span class="status ${escapeHTML(status)}">
              ${escapeHTML(
                operation.status ||
                'Pending'
              )}
            </span>

          </article>
        `;
      })
      .join('');
}


/* =========================================================
   ANNOUNCEMENTS
   ========================================================= */

function renderAnnouncementsPage() {

  renderAnnouncements(
    state.announcements || []
  );
}


function renderAnnouncements(
  items
) {

  const container =
    $('announcementsGrid');


  if (!container) {
    return;
  }


  if (!items.length) {

    container.innerHTML = `
      <p class="empty">
        No Coalition directives have
        been published.
      </p>
    `;

    return;
  }


  container.innerHTML =
    items
      .map(item => `

        <article class="
          announcement
          ${enabled(item.pinned)
            ? 'pinned'
            : ''}
        ">

          <span class="tag">
            ${escapeHTML(
              item.priority ||
              'Notice'
            )}
          </span>

          <h3>
            ${escapeHTML(
              item.title ||
              'Untitled Directive'
            )}
          </h3>

          <p>
            ${escapeHTML(
              item.body
            )}
          </p>

          <footer>
            ${formatDate(
              item.date
            )}
            ·
            ${escapeHTML(
              item.author ||
              'Global Command'
            )}
          </footer>

        </article>

      `)
      .join('');
}


/* =========================================================
   PERSONNEL PAGE
   ========================================================= */

function renderPersonnelPage() {

  const personnel =
    state.personnel || [];


  renderDivisionFilters(
    personnel
  );


  renderPersonnel(
    personnel
  );


  const search =
    $('personnelSearch');


  if (search) {

    search.oninput = () => {

      renderPersonnel(
        personnel
      );
    };
  }
}


/* =========================================================
   DIVISION FILTERS
   ========================================================= */

function renderDivisionFilters(
  personnel
) {

  const container =
    $('divisionFilters');


  if (!container) {
    return;
  }


  const divisions = [
    'All',
    ...new Set(
      personnel
        .map(
          person =>
            clean(
              person.division
            )
        )
        .filter(Boolean)
    )
  ];


  container.innerHTML =
    divisions
      .map(division => `
        <button
          type="button"
          data-division="${escapeHTML(
            division
          )}"
          class="${
            division === activeDivision
              ? 'active'
              : ''
          }"
        >
          ${escapeHTML(
            division
          )}
        </button>
      `)
      .join('');


  container
    .querySelectorAll('button')
    .forEach(button => {

      button.onclick = () => {

        activeDivision =
          button.dataset.division;

        renderDivisionFilters(
          personnel
        );

        renderPersonnel(
          personnel
        );
      };

    });
}


/* =========================================================
   RENDER PERSONNEL
   ========================================================= */

function renderPersonnel(
  personnel
) {

  const container =
    $('personnelGrid');


  if (!container) {
    return;
  }


  const search =
    clean(
      $('personnelSearch')?.value
    ).toLowerCase();


  const visible =
    personnel.filter(
      person => {

        const matchesDivision =
          activeDivision ===
          'All' ||
          clean(
            person.division
          ) === activeDivision;


        const matchesSearch =
          !search ||
          Object.values(person)
            .some(value =>
              clean(value)
                .toLowerCase()
                .includes(search)
            );


        return (
          matchesDivision &&
          matchesSearch
        );
      }
    );


  if (!visible.length) {

    container.innerHTML = `
      <p class="empty">
        No Coalition personnel match
        the current search.
      </p>
    `;

    return;
  }


  container.innerHTML =
    visible
      .map(person => {

        const identity =
          person.codename ||
          person.username ||
          '?';


        return `
          <article class="roster">

            ${
              person.avatarUrl
                ? `
                  <img
                    class="person-avatar"
                    src="${escapeHTML(
                      person.avatarUrl
                    )}"
                    alt=""
                  >
                `
                : `
                  <span class="initial">
                    ${escapeHTML(
                      identity[0]
                    )}
                  </span>
                `
            }

            <h3>
              ${escapeHTML(
                identity
              )}
            </h3>

            <p>
              ${escapeHTML(
                person.rank ||
                'Unranked'
              )}
            </p>

            <footer>
              @${escapeHTML(
                person.username ||
                'Unknown'
              )}
              ·
              ${escapeHTML(
                person.division ||
                'Coalition'
              )}
            </footer>

          </article>
        `;
      })
      .join('');
}


/* =========================================================
   MORPH PAGE
   ========================================================= */

function renderMorphPage() {

  renderMorphs(
    state.morphs || []
  );


  const form =
    $('morphForm');


  if (form) {

    form.addEventListener(
      'submit',
      event => {

        event.preventDefault();

        generateMorph();
      }
    );
  }


  const copy =
    $('copyMorph');


  if (copy) {

    copy.onclick =
      copyCommand;
  }
}


/* =========================================================
   MORPH PRESETS
   ========================================================= */

function renderMorphs(
  items
) {

  const usable =
    items.filter(
      item =>
        enabled(
          item.active
        )
    );


  const select =
    $('morphPreset');


  if (!select) {
    return;
  }


  if (!usable.length) {

    select.innerHTML = `
      <option value="">
        No active configurations
      </option>
    `;

    return;
  }


  select.innerHTML =
    usable
      .map(item => `
        <option value="${escapeHTML(
          item.id
        )}">
          ${escapeHTML(
            item.label
          )}
          —
          ${escapeHTML(
            item.category ||
            'General'
          )}
        </option>
      `)
      .join('');


  select.onchange =
    updatePresetText;


  updatePresetText();
}


/* =========================================================
   MORPH DESCRIPTION
   ========================================================= */

function updatePresetText() {

  const select =
    $('morphPreset');


  const description =
    $('presetDescription');


  if (!select || !description) {
    return;
  }


  const preset =
    (state.morphs || [])
      .find(
        item =>
          clean(item.id) ===
          select.value
      );


  description.textContent =
    preset?.description ||
    'No configuration description available.';
}


/* =========================================================
   GENERATE MORPH
   ========================================================= */

function generateMorph() {

  const select =
    $('morphPreset');


  const preset =
    (state.morphs || [])
      .find(
        item =>
          clean(item.id) ===
          select?.value
      );


  if (!preset) {
    return;
  }


  const values = {

    username:
      clean(
        $('morphUsername')?.value
      ),

    codename:
      clean(
        $('morphCodename')?.value
      ),

    rank:
      clean(
        $('morphRank')?.value
      )
  };


  currentCommand =
    clean(
      preset.commandTemplate
    )
    .replace(
      /\{(username|codename|rank)\}/g,
      (_, key) =>
        values[key]
    );


  const result =
    $('morphResult');


  if (result) {
    result.textContent =
      currentCommand;
  }


  const copy =
    $('copyMorph');


  if (copy) {
    copy.disabled =
      !currentCommand;
  }


  if ($('copyFeedback')) {

    $('copyFeedback').textContent =
      'Configuration generated. Verify your personnel details before deployment.';
  }
}


/* =========================================================
   COPY MORPH
   ========================================================= */

async function copyCommand() {

  if (!currentCommand) {
    return;
  }


  try {

    await navigator.clipboard
      .writeText(
        currentCommand
      );


    if ($('copyFeedback')) {

      $('copyFeedback').textContent =
        'Copied to clipboard.';
    }

  } catch {

    if ($('copyFeedback')) {

      $('copyFeedback').textContent =
        'Clipboard access unavailable. Copy the command manually.';
    }
  }
}


/* =========================================================
   SYSTEM PAGE
   ========================================================= */

function renderSystemPage() {

  const container =
    $('settingsGrid');


  if (!container) {
    return;
  }


  const settings =
    state.settings || {};


  const entries =
    Object.entries(settings);


  if (!entries.length) {

    container.innerHTML = `
      <p class="empty">
        No system configuration has
        been published.
      </p>
    `;

    return;
  }


  const labels = {

    siteName:
      'Organization',

    shortName:
      'Designation',

    theater:
      'Operational Theater',

    threatCondition:
      'Threat Condition',

    classification:
      'Classification',

    heroMessage:
      'Network Description',

    systemNotice:
      'System Notice'
  };


  container.innerHTML =
    entries
      .map(
        ([key, value]) => `

          <article class="settings-card">

            <span class="tag">
              ${escapeHTML(
                labels[key] ||
                key
              )}
            </span>

            <h3>
              ${escapeHTML(
                labels[key] ||
                key
              )}
            </h3>

            <p>
              ${escapeHTML(
                value
              )}
            </p>

          </article>

        `
      )
      .join('');
}


/* =========================================================
   THEME
   ========================================================= */

function initializeTheme() {

  const button =
    $('themeButton');


  if (!button) {
    return;
  }


  button.onclick = () => {

    document.body
      .classList
      .toggle(
        'high-contrast'
      );
  };
}


/* =========================================================
   START
   ========================================================= */

initializeTheme();

load();
