// Inline Comments UI
// Google Docs-style text selection commenting for proposal detail views.
// Shared by both course proposals and skill pack proposals.
//
// Usage:
//   InlineCommentsUI.init();              // once at app startup
//   InlineCommentsUI.enable(el, id, isSP) // after rendering a detail view
//   InlineCommentsUI.disable()            // before re-rendering
//   InlineCommentsUI.applyHighlights(html, comments) // highlight quoted text in HTML
//   InlineCommentsUI.buildSidebar(comments, id, isSP, isAdmin) // sidebar HTML

const InlineCommentsUI = {
    _initialized: false,
    _proposalId: null,
    _isSkillPack: false,
    _currentQuote: null,
    _activeContainer: null,

    // -------------------------------------------------------------------------
    // Initialisation (safe to call multiple times)
    // -------------------------------------------------------------------------
    init: () => {
        if (InlineCommentsUI._initialized) return;
        InlineCommentsUI._initialized = true;

        // Floating "Add Comment" button that appears near a text selection
        const btn = document.createElement('button');
        btn.id = 'ic-float-btn';
        btn.type = 'button';
        btn.innerHTML = '💬 Add Comment';
        btn.style.cssText = [
            'position:fixed', 'display:none', 'z-index:9998',
            'background:var(--champlain-navy)', 'color:white',
            'padding:6px 14px', 'border:none', 'border-radius:20px',
            'font-size:12px', 'font-weight:600', 'cursor:pointer',
            'box-shadow:0 3px 10px rgba(0,0,0,0.25)',
            'user-select:none', 'pointer-events:auto',
            'transition:opacity 0.15s'
        ].join(';');
        document.body.appendChild(btn);

        // Comment entry popover
        const popover = document.createElement('div');
        popover.id = 'ic-popover';
        popover.style.cssText = [
            'position:fixed', 'display:none', 'z-index:9999',
            'width:300px', 'background:white',
            'border:1px solid #ddd', 'border-radius:8px',
            'padding:14px', 'box-shadow:0 4px 20px rgba(0,0,0,0.18)'
        ].join(';');
        popover.innerHTML = `
            <div style="font-size:11px; font-weight:600; color:var(--champlain-navy); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.4px;">Commenting on:</div>
            <div id="ic-quote-preview" style="font-size:12px; color:#555; font-style:italic; border-left:3px solid #90caf9; padding:4px 8px; margin-bottom:10px; background:#f0f7ff; border-radius:0 4px 4px 0; word-break:break-word;"></div>
            <textarea id="ic-comment-input" rows="3"
                placeholder="Type your comment… (Ctrl+Enter to save)"
                style="width:100%; padding:8px 10px; border:1px solid #ccc; border-radius:5px; font-size:13px; resize:vertical; box-sizing:border-box; font-family:inherit; line-height:1.5;"></textarea>
            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px;">
                <button id="ic-cancel-btn" type="button"
                    style="padding:6px 16px; background:#eee; border:none; border-radius:5px; cursor:pointer; font-size:12px;">Cancel</button>
                <button id="ic-save-btn" type="button"
                    style="padding:6px 16px; background:var(--champlain-navy); color:white; border:none; border-radius:5px; cursor:pointer; font-size:12px; font-weight:600;">Save</button>
            </div>
        `;
        document.body.appendChild(popover);

        // Show popover when floating button is clicked
        btn.addEventListener('click', () => {
            const sel = window.getSelection();
            const quote = sel ? sel.toString().trim() : '';
            if (!quote) return;
            InlineCommentsUI._currentQuote = quote;

            const btnRect = btn.getBoundingClientRect();
            const left = Math.max(4, Math.min(btnRect.left, window.innerWidth - 316));
            const top = btnRect.bottom + 6;
            popover.style.left = `${left}px`;
            popover.style.top = `${top}px`;

            const preview = document.getElementById('ic-quote-preview');
            if (preview) preview.textContent = quote.length > 90 ? quote.slice(0, 90) + '…' : quote;

            const input = document.getElementById('ic-comment-input');
            if (input) input.value = '';

            popover.style.display = 'block';
            btn.style.display = 'none';
            if (input) input.focus();
        });

        document.getElementById('ic-cancel-btn').addEventListener('click', () => {
            popover.style.display = 'none';
            window.getSelection().removeAllRanges();
        });

        document.getElementById('ic-save-btn').addEventListener('click', InlineCommentsUI._saveComment);

        document.getElementById('ic-comment-input').addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                InlineCommentsUI._saveComment();
            }
            if (e.key === 'Escape') {
                document.getElementById('ic-cancel-btn').click();
            }
        });

        // Hide floating elements when clicking outside
        document.addEventListener('mousedown', (e) => {
            const floatBtn = document.getElementById('ic-float-btn');
            const pop = document.getElementById('ic-popover');
            if (floatBtn && !floatBtn.contains(e.target) && pop && !pop.contains(e.target)) {
                floatBtn.style.display = 'none';
                pop.style.display = 'none';
            }
        });
    },

    // -------------------------------------------------------------------------
    // Enable / disable on a container element
    // -------------------------------------------------------------------------

    /**
     * Enable text-selection commenting on a container (admin-only).
     * @param {Element} containerEl
     * @param {number}  proposalId
     * @param {boolean} isSkillPack
     */
    enable: (containerEl, proposalId, isSkillPack) => {
        if (!containerEl) return;
        if (!Auth || !Auth.hasRole || !Auth.hasRole('Administrator')) return;

        InlineCommentsUI.disable(); // clean up any previous binding

        InlineCommentsUI._proposalId = proposalId;
        InlineCommentsUI._isSkillPack = isSkillPack;
        InlineCommentsUI._activeContainer = containerEl;
        containerEl.addEventListener('mouseup', InlineCommentsUI._onMouseUp);
    },

    disable: () => {
        if (InlineCommentsUI._activeContainer) {
            InlineCommentsUI._activeContainer.removeEventListener('mouseup', InlineCommentsUI._onMouseUp);
            InlineCommentsUI._activeContainer = null;
        }
        const btn = document.getElementById('ic-float-btn');
        if (btn) btn.style.display = 'none';
        const pop = document.getElementById('ic-popover');
        if (pop) pop.style.display = 'none';
    },

    // -------------------------------------------------------------------------
    // Event handlers
    // -------------------------------------------------------------------------

    _onMouseUp: (e) => {
        if (e.target.closest('#ic-popover') || e.target.closest('#ic-float-btn')) return;

        const btn = document.getElementById('ic-float-btn');
        if (!btn) return;

        const sel = window.getSelection();
        const text = sel ? sel.toString().trim() : '';

        if (text.length < 3) {
            btn.style.display = 'none';
            return;
        }

        // Position above the selection
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const left = Math.max(4, Math.min(rect.left + rect.width / 2 - 70, window.innerWidth - 180));
        btn.style.left = `${left}px`;
        btn.style.top = `${rect.top - 40 + window.scrollY}px`;
        btn.style.display = 'block';
    },

    _saveComment: () => {
        const input = document.getElementById('ic-comment-input');
        const comment = input ? input.value.trim() : '';
        if (!comment) {
            if (input) input.focus();
            return;
        }

        const id = InlineCommentsUI._proposalId;
        const isSkillPack = InlineCommentsUI._isSkillPack;
        const quote = InlineCommentsUI._currentQuote;
        if (!quote || !id) return;

        const pop = document.getElementById('ic-popover');
        if (pop) pop.style.display = 'none';
        window.getSelection().removeAllRanges();

        if (isSkillPack) {
            StateSetters.addSkillPackInlineComment(id, { quote, comment });
            SkillPackProposalsModule.viewDetails(id);
        } else {
            StateSetters.addProposalInlineComment(id, { quote, comment });
            ProposalsModule.viewDetails(id);
        }
    },

    // -------------------------------------------------------------------------
    // HTML helpers
    // -------------------------------------------------------------------------

    /**
     * Insert <mark> elements around quoted text inside an HTML string.
     * Only replaces the first occurrence of each quote to avoid duplicates.
     * Quotes that span HTML tag boundaries are silently skipped.
     *
     * @param {string} html
     * @param {Array}  inlineComments
     * @returns {string}
     */
    applyHighlights: (html, inlineComments) => {
        if (!inlineComments || inlineComments.length === 0) return html;
        let result = html;
        let badgeNum = 0;
        inlineComments.forEach((ic) => {
            if (!ic.quote || ic.resolved) return;
            badgeNum++;
            const n = badgeNum;
            // Escape regex special characters in the quoted text
            const escaped = ic.quote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Only replace the first match; skip if not found (e.g. crosses a tag boundary)
            if (!new RegExp(escaped).test(result)) return;
            const badge = `<sup style="background:var(--champlain-navy);color:white;border-radius:50%;padding:1px 5px;font-size:9px;margin-left:2px;vertical-align:super;cursor:default;" title="Comment ${n}">${n}</sup>`;
            const mark = `<mark class="ic-highlight" data-cid="${ic.id}" style="background:#fff59d;border-radius:2px;cursor:default;">${ic.quote}${badge}</mark>`;
            result = result.replace(new RegExp(escaped), mark);
        });
        return result;
    },

    /**
     * Build the HTML for the inline comments sidebar panel.
     *
     * @param {Array}   inlineComments
     * @param {number}  proposalId
     * @param {boolean} isSkillPack
     * @param {boolean} isAdmin
     * @returns {string}
     */
    buildSidebar: (inlineComments, proposalId, isSkillPack, isAdmin) => {
        const active   = (inlineComments || []).filter(ic => !ic.resolved);
        const resolved = (inlineComments || []).filter(ic =>  ic.resolved);

        const resolveBtn = (ic) => isAdmin
            ? `<button type="button"
                onclick="InlineCommentsUI.resolveComment('${ic.id}', ${proposalId}, ${isSkillPack})"
                style="background:none;border:none;color:var(--champlain-green);cursor:pointer;font-size:11px;font-weight:600;padding:0;white-space:nowrap;">✓ Resolve</button>`
            : '';

        const renderItem = (ic, num, dim = false) => `
            <div class="ic-comment-item" style="background:white;border:1px solid #e8e8e8;border-left:3px solid var(--champlain-navy);border-radius:5px;padding:10px 12px;margin-bottom:8px;font-size:13px;${dim ? 'opacity:0.5;' : ''}">
                ${num ? `<div style="display:flex;align-items:center;gap:5px;margin-bottom:5px;"><span style="background:var(--champlain-navy);color:white;border-radius:50%;width:17px;height:17px;font-size:10px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${num}</span><span style="font-size:11px;color:#888;font-style:italic;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">"${ic.quote.length > 50 ? ic.quote.slice(0, 50) + '…' : ic.quote}"</span></div>` : `<div style="font-size:11px;color:#bbb;font-style:italic;margin-bottom:5px;border-left:2px solid #ddd;padding-left:5px;">"${ic.quote.length > 50 ? ic.quote.slice(0, 50) + '…' : ic.quote}"</div>`}
                <div style="color:#333;margin-bottom:6px;white-space:pre-wrap;word-break:break-word;line-height:1.5;">${ic.comment}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px;">
                    <span style="font-size:11px;color:#bbb;">${ic.from} · ${ic.date}</span>
                    ${resolveBtn(ic)}
                </div>
            </div>
        `;

        if (active.length === 0 && resolved.length === 0) {
            const hint = isAdmin
                ? '<p style="color:#bbb;font-size:11px;margin-top:8px;line-height:1.5;">Select any text in the proposal and click <strong>💬 Add Comment</strong> to annotate it.</p>'
                : '';
            return `<div style="color:#aaa;font-size:13px;text-align:center;padding:16px 8px;">No inline comments yet.${hint}</div>`;
        }

        let badgeNum = 0;
        const activeHtml = active.map(ic => { badgeNum++; return renderItem(ic, badgeNum); }).join('');

        const resolvedHtml = resolved.length > 0
            ? `<details style="margin-top:8px;">
                <summary style="font-size:11px;color:#bbb;cursor:pointer;text-transform:uppercase;letter-spacing:0.4px;list-style:none;display:flex;align-items:center;gap:4px;">
                    <span>▸</span> ${resolved.length} resolved
                </summary>
                <div style="margin-top:6px;">${resolved.map(ic => renderItem(ic, null, true)).join('')}</div>
               </details>`
            : '';

        return activeHtml + resolvedHtml;
    },

    /**
     * Build the full two-column detail layout HTML.
     * @param {string}  contentHtml    - The main proposal content HTML string
     * @param {Array}   inlineComments
     * @param {number}  proposalId
     * @param {boolean} isSkillPack
     * @param {boolean} isAdmin
     * @returns {string}
     */
    wrapWithSidebar: (contentHtml, inlineComments, proposalId, isSkillPack, isAdmin) => {
        const highlighted = InlineCommentsUI.applyHighlights(contentHtml, inlineComments);
        const sidebarBody  = InlineCommentsUI.buildSidebar(inlineComments, proposalId, isSkillPack, isAdmin);
        const activeCount  = (inlineComments || []).filter(c => !c.resolved).length;
        const countBadge   = activeCount > 0
            ? `<span style="background:white;color:var(--champlain-navy);border-radius:10px;padding:1px 7px;font-size:11px;font-weight:700;margin-left:6px;">${activeCount}</span>`
            : '';
        const adminHint    = isAdmin
            ? `<span style="font-size:10px;font-weight:400;opacity:0.75;margin-left:auto;">Select text to comment</span>`
            : '';

        return `
            <div style="display:flex;gap:18px;align-items:flex-start;">
                <div id="ic-main-content" style="flex:1;min-width:0;">${highlighted}</div>
                <div id="ic-sidebar" style="width:270px;flex-shrink:0;">
                    <div style="background:var(--champlain-navy);color:white;padding:10px 14px;border-radius:6px 6px 0 0;font-size:13px;font-weight:600;display:flex;align-items:center;">
                        💬 Inline Comments${countBadge}${adminHint}
                    </div>
                    <div style="border:1px solid #e0e0e0;border-top:none;border-radius:0 0 6px 6px;padding:10px;max-height:70vh;overflow-y:auto;background:#fafafa;">
                        ${sidebarBody}
                    </div>
                </div>
            </div>
        `;
    },

    // -------------------------------------------------------------------------
    // Resolve action (called from sidebar button onclick)
    // -------------------------------------------------------------------------

    resolveComment: (commentId, proposalId, isSkillPack) => {
        if (isSkillPack) {
            StateSetters.resolveSkillPackInlineComment(proposalId, commentId);
            SkillPackProposalsModule.viewDetails(proposalId);
        } else {
            StateSetters.resolveProposalInlineComment(proposalId, commentId);
            ProposalsModule.viewDetails(proposalId);
        }
    }
};
