/**
 * MFC Youth Area Management System - Ministry Services & Assignments
 *
 * What this file does:
 * Organizes and displays ministry service teams (such as Music, Dance, Media, Graphics,
 * and high school or campus tracks). It allows leaders to view who is serving in each ministry
 * and manage ministry assignments.
 *
 * Backup plan if it breaks:
 * If service groups cannot be loaded or an unassigned chapter is encountered, the screen
 * safely shows an empty state message and lets you navigate back to the dashboard without losing data.
 */

let currentServiceSections = [];

/**
 * Display Ministry Services Screen
 *
 * What it does:
 * Checks your leadership role and builds cards showing how many youth are serving in each ministry
 * (for example, Creative Ministries for LIT servants, or School Tracks for Campus and High School servants).
 *
 * Backup plan if it breaks:
 * If your chapter or role is missing, it safely falls back to standard service lists or displays
 * an unassigned chapter notice instead of failing.
 */
function renderServices() {
  const data = db();
  let pageTitle = 'Services';
  let pageDesc = 'View the built-in MFC Youth service roles and assigned members.';
  currentServiceSections = [];

  if (session?.role === 'area_servant' || session?.role === 'national_coordinator' || session?.role === 'couple_coordinator') {
    pageTitle = 'Area Core Roles & Chapters';
    pageDesc = 'View the 4 Core Roles and the number of Chapters in your Area.';
    currentServiceSections = [
      {
        id: 'LIT Servant (Moderator)',
        title: 'LIT Servant',
        members: data.members.filter(m => m.accessLevel === 'lit_servant')
      },
      {
        id: 'Campus Servant (Moderator)',
        title: 'Campus Servant',
        members: data.members.filter(m => m.accessLevel === 'campus_servant')
      },
      {
        id: 'MFC High Servant (Moderator)',
        title: 'MFC High Servant',
        members: data.members.filter(m => m.accessLevel === 'mfc_high_servant')
      },
      {
        id: 'MFC Kids Servant (Moderator)',
        title: 'MFC Kids Servant',
        members: data.members.filter(m => m.accessLevel === 'area_kids_servant')
      },
      {
        id: 'Chapter Servant (Moderator)',
        title: 'Chapter Servant',
        members: data.members.filter(m => m.accessLevel === 'chapter_servant'),
        countOverride: data.chapters.length,
        labelOverride: data.chapters.length === 1 ? 'Chapter' : 'Chapters'
      }
    ];
  } else if (session?.role === 'lit_servant') {
    pageTitle = 'Service Tab';
    pageDesc = 'View the 5 Creative Ministries and assigned members.';
    const ministries = ['Music', 'Dance', 'Creative Writing', 'Graphics & Promo', 'Photography & Videography'];
    currentServiceSections = ministries.map(service => ({
      id: service,
      title: service,
      members: data.members.filter(m => (m.services || []).includes(service)),
      isService: true
    }));
  } else if (session?.role === 'campus_servant') {
    pageTitle = 'Campus Services';
    pageDesc = 'View Registered College and SHS Students.';
    currentServiceSections = [
      {
        id: 'SHS Students',
        title: 'SHS Students',
        members: data.members.filter(m => m.academicTrack === 'Senior High School (SHS)' || m.academicTrack === 'SHS')
      },
      {
        id: 'College Students',
        title: 'College Students',
        members: data.members.filter(m => m.academicTrack === 'College')
      }
    ];
  } else if (session?.role === 'mfc_high_servant') {
    pageTitle = 'MFC High Services';
    pageDesc = 'View Registered HS Students.';
    currentServiceSections = [
      {
        id: 'HS Students',
        title: 'HS Students',
        members: data.members.filter(m => m.academicTrack === 'High School (HS)' || m.academicTrack === 'HS')
      }
    ];
  } else if (session?.role === 'area_kids_servant') {
    pageTitle = 'MFC Kids Services';
    pageDesc = 'View Registered Heartchamps.';
    currentServiceSections = [
      {
        id: 'Heartchamp',
        title: 'Heartchamp',
        members: data.members.filter(m => m.academicTrack === 'Heartchamp' || m.program === 'Heartchamp')
      }
    ];
  } else if (session?.role === 'chapter_servant') {
    pageTitle = 'Chapter Services';
    pageDesc = 'View and manage the Chapter you are assigned to.';
    const chapterId = session.chapterId || (data.chapters[0] ? data.chapters[0].id : null);
    const myChapter = data.chapters.find(c => c.id === chapterId);
    if (myChapter) {
      currentServiceSections = [
        {
          id: `${myChapter.name} Members`,
          title: `${myChapter.name} Members`,
          members: data.members.filter(m => m.chapterId === myChapter.id)
        }
      ];
    } else {
      currentServiceSections = [
        {
          id: 'Unassigned Chapter',
          title: 'Unassigned Chapter',
          members: []
        }
      ];
    }
  } else {
    currentServiceSections = data.services.map(service => ({
      id: service,
      title: service,
      members: data.members.filter(m => (m.services || []).includes(service)),
      isService: true
    }));
  }

  content.innerHTML =
    pageHeader(pageTitle, pageDesc) +
    `
    <div class="service-grid">
      ${currentServiceSections.map(section => {
        const count = section.countOverride !== undefined ? section.countOverride : section.members.length;
        const label = section.labelOverride !== undefined ? section.labelOverride : (count === 1 ? 'Assigned member' : 'Assigned members');
        
        return `
            <section class="card service-card">
              <h3>${esc(section.title)}</h3>
              <div class="count">${count}</div>
              <p>${label}</p>
              <button
                class="btn"
                onclick="viewService('${esc(section.id).replace(/'/g, "\\'")}')"
              >
                View Members
              </button>
            </section>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Remove Member from Ministry
 *
 * What it does:
 * Unassigns a youth member from a specific ministry role (like Music or Dance)
 * after asking for your confirmation.
 *
 * Backup plan if it breaks:
 * Checks for Area Administrator permissions first, asks for confirmation, and displays a friendly
 * error toast if the server cannot be reached while keeping the existing assignment untouched.
 */
window.removeMemberService = async (memberId, serviceName) => {
  if (denyUnlessAreaAdmin()) return;
  const data = db();
  const member = data.members.find(m => String(m.id) === String(memberId));
  if (!member) return;
  if (!confirm(`Remove "${serviceName}" assignment from ${fullName(member)}?`)) return;

  const updatedServices = (member.services || []).filter(s => s !== serviceName);
  try {
    if (session?.backendAuth && !session?.demo) {
      await backendApi('/api/services', {
        method: 'PATCH',
        body: JSON.stringify({ memberId: member.id, serviceNames: updatedServices })
      });
      await refreshAllCloudData({ render: false });
    } else {
      member.services = updatedServices;
      save(data);
    }
    toast(`Removed ${serviceName} from ${fullName(member)}.`);
    activeModalCleanup?.();
    window.viewService(serviceName);
    renderServices();
  } catch (error) {
    toast(error?.message || 'Unable to update service assignment.', 'error');
  }
};

/**
 * View Members in Ministry
 *
 * What it does:
 * Pops up a window listing all the youth currently assigned to the clicked ministry or leadership track.
 *
 * Backup plan if it breaks:
 * If the category section is missing from memory, it searches member records on the fly,
 * and shows a friendly "No assigned members" message if no one is assigned yet.
 */
window.viewService = serviceId => {
  const data = db();
  const canManage = isAreaAdminSession();
  
  let section = (typeof currentServiceSections !== 'undefined') 
    ? currentServiceSections.find(s => s.id === serviceId) 
    : null;
    
  if (!section) {
    section = {
      title: serviceId,
      isService: true,
      members: data.members.filter(m => (m.services || []).includes(serviceId))
    };
  }

  const members = section.members;

  openModal(
    `${esc(section.title)} Members`,
    
    members.length
      ? `
        <div class="mini-list">
          ${members.map(member => `
            <div class="mini-row" style="align-items: center;">
              <div>
                <strong>${esc(fullName(member))}</strong>
                <div class="muted">${esc(member.chapterName || 'No Chapter')}</div>
              </div>
              ${canManage && section.isService
                ? `
                  <button class="btn red" type="button"
                    onclick='removeMemberService(${inlineJsArg(member.id)}, ${inlineJsArg(serviceId)})'
                    style="padding: 3px 8px; font-size: 0.76rem;" title="Remove ${esc(serviceId)} assignment">
                    Remove
                  </button>
                `
                : ''
              }
            </div>
          `).join('')}
        </div>
      `
      : emptyState(
        'No assigned members',
        'No members found for this category.'
      )
  );
};
