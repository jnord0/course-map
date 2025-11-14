// Proposals Management Component

const ProposalsModule = {
    currentProposalId: null,
    
    /**
     * Show my proposals modal
     */
    showMyProposals: () => {
        const myProposals = StateGetters.getProposals().filter(p => p.submittedBy === StateGetters.getCurrentUser());
        const listDiv = document.getElementById('myProposalsList');
        
        if (myProposals.length === 0) {
            listDiv.innerHTML = '<p style="text-align: center; color: #666;">No proposals submitted yet.</p>';
        } else {
            listDiv.innerHTML = myProposals.map(p => {
                const hasFeedback = p.feedback && p.feedback.length > 0;
                return `
                    <div class="proposal-card">
                        <div class="proposal-header">
                            <div class="proposal-title">${p.courseCode}: ${p.courseTitle}</div>
                            <div class="proposal-status status-${p.status}">${p.status.toUpperCase()}</div>
                        </div>
                        <div class="proposal-info">
                            Submitted: ${p.submittedDate}
                            ${hasFeedback ? `<span style="color: #FF9800; font-weight: bold; margin-left: 10px;">💬 ${p.feedback.length} Feedback</span>` : ''}
                        </div>
                        <div class="proposal-actions">
                            <button class="action-btn btn-view" onclick="ProposalsModule.viewDetails(${p.id})">View Details</button>
                            ${p.status === 'pending' ? `
                                <button class="action-btn" style="background: var(--champlain-blue);" onclick="ProposalsModule.editProposal(${p.id})">✏️ Edit</button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        document.getElementById('myProposalsModal').style.display = 'block';
    },
    
    /**
     * Show proposal review modal (admin only)
     */
    showReviewModal: () => {
        const pendingProposals = StateGetters.getProposals().filter(p => p.status === 'pending');
        const listDiv = document.getElementById('proposalList');
        
        if (pendingProposals.length === 0) {
            listDiv.innerHTML = '<p style="text-align: center; color: #666;">No pending proposals.</p>';
        } else {
            listDiv.innerHTML = pendingProposals.map(p => {
                const hasFeedback = p.feedback && p.feedback.length > 0;
                return `
                    <div class="proposal-card">
                        <div class="proposal-header">
                            <div class="proposal-title">${p.courseCode}: ${p.courseTitle}</div>
                            <div class="proposal-status status-${p.status}">${p.status.toUpperCase()}</div>
                        </div>
                        <div class="proposal-info">
                            By: ${p.submittedBy} | ${p.submittedDate}
                            ${hasFeedback ? `<span style="color: #FF9800; font-weight: bold; margin-left: 10px;">💬 ${p.feedback.length} Feedback</span>` : ''}
                        </div>
                        <div class="proposal-actions">
                            <button class="action-btn btn-view" onclick="ProposalsModule.viewDetails(${p.id})">View</button>
                            <button class="action-btn" style="background: #FF9800;" onclick="ProposalsModule.sendFeedback(${p.id})">💬 Feedback</button>
                            <button class="action-btn btn-approve" onclick="ProposalsModule.approve(${p.id})">Approve</button>
                            <button class="action-btn btn-reject" onclick="ProposalsModule.rejectWithFeedback(${p.id})">Reject</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        document.getElementById('reviewModal').style.display = 'block';
    },
    
    /**
     * View proposal details
     * @param {number} id 
     */
    viewDetails: (id) => {
        const proposal = StateGetters.getProposals().find(p => p.id === id);
        if (!proposal) return;
        
        // Store current proposal ID for export
        ProposalsModule.currentProposalId = id;
        
        const competencyNames = {
            'communication': 'Communication',
            'thinking': 'Critical Thinking',
            'learning': 'Self-Directed Learning',
            'collaboration': 'Collaboration',
            'global': 'Global Understanding',
            'ethics': 'Ethics & Social Responsibility',
            'information': 'Information Literacy'
        };
        
        // Handle both old array format and new object format for competencies
        let competenciesDisplay = '';
        if (Array.isArray(proposal.competencies)) {
            // Old format: just an array of competency IDs
            competenciesDisplay = proposal.competencies.map(c => competencyNames[c]).join(', ');
        } else {
            // New format: object with weights
            competenciesDisplay = Object.entries(proposal.competencies)
                .filter(([id, weight]) => weight > 0)
                .map(([id, weight]) => {
                    const weightLabel = weight === 3 ? 'Emphasized' : weight === 2 ? 'Reinforced' : 'Addressed';
                    const symbol = weight === 3 ? '★' : weight === 2 ? '◆' : '◉';
                    return `${symbol} ${competencyNames[id]} (${weightLabel})`;
                })
                .join(', ');
        }
        
        // Build feedback section
        let feedbackSection = '';
        if (proposal.feedback && proposal.feedback.length > 0) {
            feedbackSection = `
                <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ff9800; border-radius: 4px;">
                    <h4 style="color: #856404; margin-bottom: 10px; font-size: 16px;">💬 Feedback History</h4>
                    ${proposal.feedback.map(fb => `
                        <div style="background: white; padding: 12px; border-radius: 4px; margin-bottom: 10px; border: 1px solid #ffc107;">
                            <div style="font-size: 12px; color: #666; margin-bottom: 6px;">
                                <strong>${fb.from}</strong> - ${fb.date}
                            </div>
                            <div style="font-size: 14px; color: #333;">${fb.message}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        document.getElementById('proposalDetails').innerHTML = `
            <div style="margin-bottom: 20px;">
                <h3 style="color: var(--champlain-navy); margin-bottom: 15px;">${proposal.courseCode}: ${proposal.courseTitle}</h3>
                <p style="margin-bottom: 12px;"><strong>Description:</strong> ${proposal.description}</p>
                <p style="margin-bottom: 12px;"><strong>Credits:</strong> ${proposal.creditHours}</p>
                <p style="margin-bottom: 12px;"><strong>Prerequisites:</strong> ${proposal.prerequisites || 'None'}</p>
                <p style="margin-bottom: 12px;"><strong>Competencies:</strong> ${competenciesDisplay}</p>
                <p style="margin-bottom: 12px;"><strong>Justification:</strong> ${proposal.justification}</p>
                <p style="font-size: 13px; color: #666; margin-top: 20px;">Submitted by: ${proposal.submittedBy} | ${proposal.submittedDate}</p>
                ${feedbackSection}
            </div>
        `;
        
        document.getElementById('detailsModal').style.display = 'block';
        
        // Setup export button handler
        const exportBtn = document.getElementById('exportProposalBtn');
        if (exportBtn) {
            exportBtn.onclick = () => ProposalsModule.exportProposal(id);
        }
    },
    
    /**
     * Send feedback to faculty
     * @param {number} id 
     */
    sendFeedback: (id) => {
        const proposal = StateGetters.getProposals().find(p => p.id === id);
        if (!proposal) return;
        
        const feedback = prompt(`Send feedback to ${proposal.submittedBy} about "${proposal.courseCode}":\n\n(Faculty will be able to revise their proposal based on your feedback)`);
        
        if (feedback && feedback.trim() !== '') {
            StateSetters.addProposalFeedback(id, feedback.trim());
            ProposalsModule.showReviewModal();
            alert('Feedback sent successfully! Faculty member will be notified.');
        }
    },
    
    /**
     * Reject with feedback
     * @param {number} id 
     */
    rejectWithFeedback: (id) => {
        const proposal = StateGetters.getProposals().find(p => p.id === id);
        if (!proposal) return;
        
        const feedback = prompt(`Please provide feedback for rejection of "${proposal.courseCode}":\n\n(This will help faculty understand why the proposal was not approved)`);
        
        if (feedback === null) return; // User cancelled
        
        if (feedback && feedback.trim() !== '') {
            StateSetters.addProposalFeedback(id, `[REJECTION] ${feedback.trim()}`);
        }
        
        if (confirm('Are you sure you want to reject this proposal?')) {
            StateSetters.updateProposalStatus(id, 'rejected');
            ProposalsModule.updatePendingBadge();
            ProposalsModule.showReviewModal();
            alert('Proposal rejected with feedback.');
        }
    },
    
    /**
     * Edit proposal (faculty only)
     * @param {number} id 
     */
    editProposal: (id) => {
        const proposal = StateGetters.getProposals().find(p => p.id === id);
        if (!proposal) return;
        
        ProposalsModule.currentProposalId = id;
        
        // Populate form with existing data
        document.getElementById('courseCode').value = proposal.courseCode;
        document.getElementById('courseTitle').value = proposal.courseTitle;
        document.getElementById('courseDescription').value = proposal.description;
        document.getElementById('prerequisites').value = proposal.prerequisites || '';
        document.getElementById('creditHours').value = proposal.creditHours;
        document.getElementById('justification').value = proposal.justification;
        
        // Set competency weights
        const competencyIds = ['communication', 'thinking', 'learning', 'collaboration', 'global', 'ethics', 'information'];
        const selectIds = ['comp_comm', 'comp_thinking', 'comp_learning', 'comp_collab', 'comp_global', 'comp_ethics', 'comp_info'];
        
        selectIds.forEach((selectId, index) => {
            const select = document.getElementById(selectId);
            const compId = competencyIds[index];
            const weight = proposal.competencies[compId] || 0;
            if (select) {
                select.value = weight;
            }
        });
        
        // Change submit button text
        const submitBtn = document.querySelector('#proposalForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Update Proposal';
        }
        
        // Close my proposals modal
        document.getElementById('myProposalsModal').style.display = 'none';
        
        // Open proposal modal
        document.getElementById('proposalModal').style.display = 'block';
    },
    
    /**
     * Export proposal as formatted document
     * @param {number} proposalId 
     */
    exportProposal: (proposalId) => {
        const proposal = StateGetters.getProposals().find(p => p.id === proposalId);
        
        if (!proposal) {
            alert('Proposal not found');
            return;
        }
        
        const competencyNames = {
            'communication': 'Communication',
            'thinking': 'Critical Thinking',
            'learning': 'Self-Directed Learning',
            'collaboration': 'Collaboration',
            'global': 'Global Understanding',
            'ethics': 'Ethics & Social Responsibility',
            'information': 'Information Literacy'
        };
        
        // Handle both old array format and new object format
        let compNames = [];
        let compDetails = '';
        
        if (Array.isArray(proposal.competencies)) {
            // Old format
            compNames = proposal.competencies.map(c => competencyNames[c] || c);
            compDetails = compNames.map(c => `  ✓ ${c}`).join('\n');
        } else {
            // New format with weights
            const entries = Object.entries(proposal.competencies).filter(([id, weight]) => weight > 0);
            compNames = entries.map(([id, weight]) => {
                const name = competencyNames[id] || id;
                const weightLabel = weight === 3 ? 'Emphasized' : weight === 2 ? 'Reinforced' : 'Addressed';
                return `${name} (${weightLabel} - ${weight})`;
            });
            compDetails = entries.map(([id, weight]) => {
                const name = competencyNames[id] || id;
                const weightLabel = weight === 3 ? 'Emphasized' : weight === 2 ? 'Reinforced' : 'Addressed';
                const symbol = weight === 3 ? '★' : weight === 2 ? '◆' : '◉';
                return `  ${symbol} ${name} - ${weightLabel} (Weight: ${weight})`;
            }).join('\n');
        }
        
        // Build feedback section
        let feedbackSection = '';
        if (proposal.feedback && proposal.feedback.length > 0) {
            feedbackSection = '\n================================================================================\n\n';
            feedbackSection += 'FEEDBACK HISTORY\n';
            feedbackSection += '================================================================================\n\n';
            proposal.feedback.forEach(fb => {
                feedbackSection += `Date: ${fb.date}\n`;
                feedbackSection += `From: ${fb.from}\n`;
                feedbackSection += `Message:\n${fb.message}\n\n`;
                feedbackSection += '---\n\n';
            });
        }
        
        // Create formatted proposal document
        let content = `CHAMPLAIN COLLEGE
ACADEMIC AFFAIRS
Course Proposal Form

================================================================================

COURSE INFORMATION
================================================================================

Course Code:        ${proposal.courseCode}
Course Title:       ${proposal.courseTitle}
Credit Hours:       ${proposal.creditHours}
Prerequisites:      ${proposal.prerequisites || 'None'}

================================================================================

COURSE DESCRIPTION
================================================================================

${proposal.description}

================================================================================

COLLEGE COMPETENCIES ADDRESSED
================================================================================

${compNames.join(', ')}

Individual Competencies with Weights:
${compDetails}

Legend:
  ★ = Emphasized (3)
  ◆ = Reinforced (2)
  ◉ = Addressed (1)

================================================================================

JUSTIFICATION
================================================================================

${proposal.justification}

================================================================================

SUBMISSION INFORMATION
================================================================================

Submitted By:       ${proposal.submittedBy}
Submission Date:    ${proposal.submittedDate}
Status:             ${proposal.status.toUpperCase()}
${feedbackSection}
================================================================================

COMPETENCY ANALYSIS
================================================================================

Total Competencies: ${Array.isArray(proposal.competencies) ? proposal.competencies.length : Object.keys(proposal.competencies).length} of 7
Coverage Percentage: ${Array.isArray(proposal.competencies) ? Math.round((proposal.competencies.length / 7) * 100) : Math.round((Object.keys(proposal.competencies).length / 7) * 100)}%

Competency Breakdown:
${Object.keys(competencyNames).map(key => {
    let status = '[ ]';
    if (Array.isArray(proposal.competencies)) {
        status = proposal.competencies.includes(key) ? '[X]' : '[ ]';
        return `${status} ${competencyNames[key]}`;
    } else {
        const weight = proposal.competencies[key] || 0;
        if (weight > 0) {
            const weightLabel = weight === 3 ? 'Emphasized' : weight === 2 ? 'Reinforced' : 'Addressed';
            return `[X] ${competencyNames[key]} - ${weightLabel} (${weight})`;
        }
        return `[ ] ${competencyNames[key]}`;
    }
}).join('\n')}

================================================================================

ADMINISTRATIVE REVIEW SECTION
================================================================================

Review Status: ${proposal.status.toUpperCase()}

NOTES FOR REVIEW:
- Alignment with college competencies
- Appropriateness of prerequisites
- Course description clarity and completeness
- Justification strength
- Impact on existing curriculum

REVIEWER COMMENTS:
_____________________________________________________________________________

_____________________________________________________________________________

_____________________________________________________________________________


DECISION:  [ ] APPROVE    [ ] REJECT    [ ] REVISIONS NEEDED


Reviewer Name: ________________________________   Date: __________________

Signature: ____________________________________

================================================================================

Generated: ${new Date().toLocaleString()}
System: Champlain Academic Affairs Management System
Export ID: ${proposal.id}-${Date.now()}
`;
        
        // Create download
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const date = new Date().toISOString().split('T')[0];
        const filename = `proposal-${proposal.courseCode.replace(/[^a-zA-Z0-9]/g, '-')}-${date}.txt`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert(`Proposal for ${proposal.courseCode} exported successfully!`);
    },
    
    /**
     * Approve a proposal
     * @param {number} id 
     */
    approve: (id) => {
        if (confirm('Approve this proposal?')) {
            StateSetters.updateProposalStatus(id, 'approved');
            ProposalsModule.updatePendingBadge();
            ProposalsModule.showReviewModal();
            alert('Proposal approved!');
        }
    },
    
    /**
     * Reject a proposal
     * @param {number} id 
     */
    reject: (id) => {
        if (confirm('Reject this proposal?')) {
            StateSetters.updateProposalStatus(id, 'rejected');
            ProposalsModule.updatePendingBadge();
            ProposalsModule.showReviewModal();
            alert('Proposal rejected.');
        }
    },
    
    /**
     * Submit new proposal or update existing
     * @param {Event} e 
     */
    submitProposal: (e) => {
        e.preventDefault();
        
        const competencies = {};
        const competencyIds = ['communication', 'thinking', 'learning', 'collaboration', 'global', 'ethics', 'information'];
        const selectIds = ['comp_comm', 'comp_thinking', 'comp_learning', 'comp_collab', 'comp_global', 'comp_ethics', 'comp_info'];
        
        let hasAtLeastOne = false;
        selectIds.forEach((selectId, index) => {
            const select = document.getElementById(selectId);
            const weight = parseInt(select.value);
            if (weight > 0) {
                competencies[competencyIds[index]] = weight;
                hasAtLeastOne = true;
            }
        });
        
        if (!hasAtLeastOne) {
            alert('Please select at least one college competency with a weight greater than 0');
            return;
        }
        
        const proposalData = {
            courseCode: document.getElementById('courseCode').value,
            courseTitle: document.getElementById('courseTitle').value,
            description: document.getElementById('courseDescription').value,
            prerequisites: document.getElementById('prerequisites').value,
            creditHours: document.getElementById('creditHours').value,
            competencies: competencies,
            justification: document.getElementById('justification').value
        };
        
        if (ProposalsModule.currentProposalId) {
            // Update existing proposal
            StateSetters.updateProposal(ProposalsModule.currentProposalId, proposalData);
            
            const successMsg = document.getElementById('proposalSuccess');
            successMsg.textContent = 'Proposal updated successfully!';
            successMsg.classList.remove('hidden');
            
            setTimeout(() => {
                ModalsModule.closeProposalModal();
                successMsg.classList.add('hidden');
                ProposalsModule.currentProposalId = null;
                document.querySelector('#proposalForm button[type="submit"]').textContent = 'Submit Proposal';
            }, 2000);
        } else {
            // Create new proposal
            const proposal = {
                ...proposalData,
                submittedBy: StateGetters.getCurrentUser(),
                submittedDate: new Date().toISOString().split('T')[0],
                status: 'pending',
                feedback: []
            };
            
            StateSetters.addProposal(proposal);
            
            const successMsg = document.getElementById('proposalSuccess');
            successMsg.textContent = 'Course proposal submitted successfully!';
            successMsg.classList.remove('hidden');
            
            setTimeout(() => {
                ModalsModule.closeProposalModal();
                successMsg.classList.add('hidden');
            }, 2000);
        }
        
        document.getElementById('proposalForm').reset();
    },
    
    /**
     * Update pending badge count
     */
    updatePendingBadge: () => {
        const pendingCount = StateGetters.getProposals().filter(p => p.status === 'pending').length;
        const badge = document.getElementById('pendingBadge');
        if (pendingCount > 0) {
            badge.textContent = pendingCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
};