/*
 * mbomFilterDropdown.js (rebuild)
 * Responsibilities implemented here:
 * - Load server-provided mapping `window.MFG_BY_TYPE` (or from `#mfg-data`).
 * - For add-item forms: keep `.itemMfgSelect` disabled/grayed until `.itemTypeSelect` is chosen.
 * - When an Item Type is selected, populate `.itemMfgSelect` with manufacturers for that type.
 * - If Item Type === 'OTHER', populate the full manufacturer list and include 'OTHER'.
 * - Show `.itemMfgOther` free-text input when the MFG select value is 'OTHER'.
 * - Trigger Select2 updates when present so the visual control stays in sync.
 */

(function($){
	'use strict';

	function loadMfgMap() {
		if (typeof window.MFG_BY_TYPE !== 'undefined') return;
		var $el = $('#mfg-data');
		if ($el.length) {
			try {
				window.MFG_BY_TYPE = JSON.parse($el.attr('data-mfg')) || {};
			} catch (e) {
				window.MFG_BY_TYPE = {};
			}
		} else {
			window.MFG_BY_TYPE = {};
		}
	}

	function getAllMfgs() {
		var set = {};
		if (!window.MFG_BY_TYPE) return [];
		Object.keys(window.MFG_BY_TYPE).forEach(function(type){
			var arr = window.MFG_BY_TYPE[type] || [];
			for (var i = 0; i < arr.length; i++) set[arr[i]] = true;
		});
		var out = Object.keys(set).sort();
		return out;
	}

	// Load description mapping provided by server: { byPair: {"type||mfg":[...]}, all: [...] }
	function loadDescMap() {
		if (typeof window.DESC_BY_PAIR !== 'undefined' && typeof window.ALL_DESCRIPTIONS !== 'undefined') return;
		var $el = $('#desc-data');
		if ($el.length) {
			try {
				var obj = JSON.parse($el.attr('data-desc')) || {};
				window.DESC_BY_PAIR = obj.byPair || {};
				window.ALL_DESCRIPTIONS = obj.all || [];
			} catch (e) {
				window.DESC_BY_PAIR = {};
				window.ALL_DESCRIPTIONS = [];
			}
		} else {
			window.DESC_BY_PAIR = {};
			window.ALL_DESCRIPTIONS = [];
		}
	}

	function getAllDescs() {
		if (!window.ALL_DESCRIPTIONS) return [];
		return window.ALL_DESCRIPTIONS.slice().sort();
	}

	// P/N mapping loader and helpers
	function loadPnMap() {
		if (typeof window.PN_BY_TRIPLET !== 'undefined' && typeof window.ALL_PNS !== 'undefined') return;
		var $el = $('#pn-data');
		if ($el.length) {
			try {
				var obj = JSON.parse($el.attr('data-pn')) || {};
				window.PN_BY_TRIPLET = obj.byTriplet || {};
				window.ALL_PNS = obj.all || [];
			} catch (e) {
				window.PN_BY_TRIPLET = {};
				window.ALL_PNS = [];
			}
		} else {
			window.PN_BY_TRIPLET = {};
			window.ALL_PNS = [];
		}
	}

	function getAllPns() {
		if (!window.ALL_PNS) return [];
		return window.ALL_PNS.slice().sort();
	}

	function populatePnForTriplet($pn, type, mfg, desc) {
		$pn.empty();
		$pn.append($('<option>', { value: '', text: 'Select P/N' }));

		// if any parent missing, disable
		if (!type || !mfg || !desc) {
			graySelect($pn, true);
			try {
				var $pnOtherClear = $pn.closest('form').find('.itemPNOther');
				if ($pnOtherClear.length) $pnOtherClear.prop('disabled', true).prop('required', false).val('').addClass('disabled');
			} catch (e) {}
			triggerSelect2($pn);
			return;
		}

		// if any parent is OTHER, set PN to OTHER and enable manual input
		if (type === 'OTHER' || mfg === 'OTHER' || desc === 'OTHER') {
			$pn.append($('<option>', { value: 'OTHER', text: 'OTHER' }));
			graySelect($pn, false);
			$pn.val('OTHER');
			triggerSelect2($pn);
			var $pnOther = $pn.closest('form').find('.itemPNOther');
			if ($pnOther.length) {
				$pnOther.prop('disabled', false).prop('required', true).removeClass('disabled');
				try { $pnOther.focus(); } catch (e) {}
			}
			return;
		}

		// normal case: try mapping by triplet
		var k = (type || '') + '||' + (mfg || '') + '||' + (desc || '');
		if (window.PN_BY_TRIPLET && window.PN_BY_TRIPLET[k]) {
			var list = window.PN_BY_TRIPLET[k] || [];
			for (var j = 0; j < list.length; j++) $pn.append($('<option>', { value: list[j], text: list[j] }));
			$pn.append($('<option>', { value: 'OTHER', text: 'OTHER' }));
			graySelect($pn, false);
			$pn.prop('selectedIndex', 0);
			triggerSelect2($pn);
			return;
		}

		// no mapping: disable
		graySelect($pn, true);
	}

	function triggerSelect2($el) {
		try { $el.trigger('change.select2'); } catch (e) { $el.trigger('change'); }
	}

	// Try to set a select's value repeatedly until it remains stable.
	// Useful when other scripts (Select2 init or later wiring) may re-initialize
	// the control and overwrite programmatic values. Attempts are bounded.
	function prefillSelectWithRetry($select, desiredVal, attemptsLeft, delayMs) {
		attemptsLeft = typeof attemptsLeft === 'number' ? attemptsLeft : 8;
		delayMs = typeof delayMs === 'number' ? delayMs : 100;
		if (!$select || !$select.length) return;

		try { $select.val(desiredVal); } catch (e) {}
		triggerSelect2($select);

		// After a short delay, verify the underlying select still has the desired value.
		setTimeout(function(){
			try {
				var cur = $select.val();
				if (String(cur) === String(desiredVal) || attemptsLeft <= 1) {
					// stable or out of attempts — ensure final trigger
					try { $select.trigger('change'); } catch (e) {}
					return;
				}
			} catch (e) {}
			// Retry
			prefillSelectWithRetry($select, desiredVal, attemptsLeft - 1, delayMs);
		}, delayMs);
	}

	function graySelect($el, disabled) {
		$el.prop('disabled', !!disabled);
		// add a class so CSS can gray it; also try to adjust inline style lightly
		if (disabled) {
			$el.addClass('mfg-disabled');
		} else {
			$el.removeClass('mfg-disabled');
		}
		triggerSelect2($el);
	}

	function updatePnRow($form) {
		// Manual inputs are visible at all times and occupy layout space; avoid shifting
		// the P/N row from script. Keep function for compatibility but make it a no-op.
		if (!$form || $form.length === 0) return;
		var $pn = $form.find('.pn-row');
		if (!$pn.length) return;
		$pn.removeClass('shifted');
	}

	function populateMfgForType($mfg, type) {
		$mfg.empty();
		$mfg.append($('<option>', { value: '', text: 'Select' }));

		if (!type) {
			graySelect($mfg, true);
			return;
		}

		if (type === 'OTHER') {
			var full = getAllMfgs();
			for (var i = 0; i < full.length; i++) {
				$mfg.append($('<option>', { value: full[i], text: full[i] }));
			}
			$mfg.append($('<option>', { value: 'OTHER', text: 'OTHER' }));
			graySelect($mfg, false);
			$mfg.prop('selectedIndex', 0);
			return;
		}

		if (window.MFG_BY_TYPE && window.MFG_BY_TYPE[type]) {
			var list = window.MFG_BY_TYPE[type] || [];
			for (var j = 0; j < list.length; j++) {
				$mfg.append($('<option>', { value: list[j], text: list[j] }));
			}
			$mfg.append($('<option>', { value: 'OTHER', text: 'OTHER' }));
			graySelect($mfg, false);
			$mfg.prop('selectedIndex', 0);
			return;
		}

		// no mapping: disable
		graySelect($mfg, true);
	}

	function populateDescForTypeMfg($desc, type, mfg) {
		$desc.empty();
		$desc.append($('<option>', { value: '', text: 'Select' }));

		// if type or mfg not selected, keep disabled
		if (!type || !mfg) {
			graySelect($desc, true);
			// ensure manual description input is disabled/cleared when there's no valid selection
			try {
				var $descOther = $desc.closest('form').find('.itemDescOther');
				if ($descOther.length) {
					$descOther.prop('disabled', true).prop('required', false).val('').addClass('disabled');
				}
			} catch (e) {}
			// notify any listeners (Select2 or normal change) so they can react
			triggerSelect2($desc);
			return;
		}

		// if either is OTHER, show full list
		if (type === 'OTHER' || mfg === 'OTHER') {
			var full = getAllDescs();
			for (var i = 0; i < full.length; i++) $desc.append($('<option>', { value: full[i], text: full[i] }));
			$desc.append($('<option>', { value: 'OTHER', text: 'OTHER' }));
			graySelect($desc, false);
			// If either parent is OTHER, default Description to OTHER and prompt manual input
			$desc.val('OTHER');
			triggerSelect2($desc);
			var $descOtherAuto = $desc.closest('form').find('.itemDescOther');
			if ($descOtherAuto.length) {
				$descOtherAuto.prop('disabled', false).prop('required', true).removeClass('disabled');
				try { $descOtherAuto.focus(); } catch (e) {}
			}
			return;
		}

		// normal case: use pair mapping
		var k = (type || '') + '||' + (mfg || '');
		if (window.DESC_BY_PAIR && window.DESC_BY_PAIR[k]) {
			var list = window.DESC_BY_PAIR[k] || [];
			for (var j = 0; j < list.length; j++) $desc.append($('<option>', { value: list[j], text: list[j] }));
			$desc.append($('<option>', { value: 'OTHER', text: 'OTHER' }));
			graySelect($desc, false);
			$desc.prop('selectedIndex', 0);
			// ensure downstream handlers (which enable/disable the manual input) are triggered
			triggerSelect2($desc);
			return;
		}

		// no mapping: disable
		graySelect($desc, true);
	}

	// Show/hide OTHER free-text box when mfgSelect value is OTHER; also update Description select
	$(document).on('change', '.itemMfgSelect', function(){
		var $m = $(this);
		var $form = $m.closest('form');
		var $other = $form.find('.itemMfgOther');
		if ($other.length) {
			var $wrap = $other.closest('.relative-input');
			if ($m.val() === 'OTHER') {
				$other.prop('disabled', false).prop('required', true).removeClass('disabled');
				try { $other.focus(); } catch (e) {}
			} else {
				$other.prop('disabled', true).prop('required', false).val('').addClass('disabled');
			}
		}

		// Update description select based on current type and mfg
		var $type = $form.find('.itemTypeSelect');
		var $desc = $form.find('.itemDescSelect');
		if ($desc.length) {
			var typeVal = $type.length ? $type.val() : '';
			populateDescForTypeMfg($desc, typeVal, $m.val());
			// trigger change so handlers enable/disable manual desc input when necessary
			triggerSelect2($desc);
		}

		// also update the Item P/N select after mfg change
		var $pn = $form.find('.itemPNSelect');
		if ($pn.length) {
			loadPnMap();
			var descVal = ($form.find('.itemDescSelect').length ? $form.find('.itemDescSelect').val() : '');
			populatePnForTriplet($pn, ($form.find('.itemTypeSelect').length ? $form.find('.itemTypeSelect').val() : ''), $m.val(), descVal);
		}
	});

	// Show/hide OTHER free-text box when descSelect value is OTHER
	$(document).on('change', '.itemDescSelect', function(){
		var $d = $(this);
		var $form = $d.closest('form');
		var $other = $form.find('.itemDescOther');
		if (!$other.length) return;
		if ($d.val() === 'OTHER') {
			$other.prop('disabled', false).prop('required', true).removeClass('disabled');
			try { $other.focus(); } catch (e) {}
		} else {
			$other.prop('disabled', true).prop('required', false).val('').addClass('disabled');
		}

		// After description changes, update the Item P/N select for this form
		var $pn = $form.find('.itemPNSelect');
		if ($pn.length) {
			loadPnMap();
			var typeVal = ($form.find('.itemTypeSelect').length ? $form.find('.itemTypeSelect').val() : '');
			var mfgVal = ($form.find('.itemMfgSelect').length ? $form.find('.itemMfgSelect').val() : '');
			populatePnForTriplet($pn, typeVal, mfgVal, $d.val());
		}
	});

	// Show/hide OTHER free-text box when pnSelect value is OTHER
	$(document).on('change', '.itemPNSelect', function(){
		var $p = $(this);
		var $form = $p.closest('form');
		var $other = $form.find('.itemPNOther');
		if (!$other.length) return;
		if ($p.val() === 'OTHER') {
			$other.prop('disabled', false).prop('required', true).removeClass('disabled');
			try { $other.focus(); } catch (e) {}
		} else {
			$other.prop('disabled', true).prop('required', false).val('').addClass('disabled');
		}
	});

	// When item type changes, populate the corresponding mfg select in the same form
	$(document).on('change', '.itemTypeSelect', function(){
		var $t = $(this);
		var type = $t.val();
		var $form = $t.closest('form');
		var $mfg = $form.find('.itemMfgSelect');
		if (!$mfg.length) return;
		populateMfgForType($mfg, type);

		// Toggle free-text Item Type input when type === 'OTHER'
		var $typeOther = $form.find('.itemTypeOther');
		if ($typeOther.length) {
			if (type === 'OTHER') {
				$typeOther.prop('disabled', false).prop('required', true).removeClass('disabled');
				try { $typeOther.focus(); } catch (e) {}
			} else {
				$typeOther.prop('disabled', true).prop('required', false).val('').addClass('disabled');
			}
		}

		// If the manual MFG input was visible (because MFG had been OTHER), hide/reset it
		var $mfgOther = $form.find('.itemMfgOther');
		if ($mfgOther.length) {
			$mfgOther.prop('disabled', true).prop('required', false).val('').addClass('disabled');
		}

		// Update description select based on new type + current mfg
		var $desc = $form.find('.itemDescSelect');
		if ($desc.length) {
			var mfgVal = $form.find('.itemMfgSelect').val();
			populateDescForTypeMfg($desc, type, mfgVal);
			// trigger change so the centralized desc handler enables/disables the manual input
			triggerSelect2($desc);
		}

		// also update the Item P/N select after the type change
		var $pn = $form.find('.itemPNSelect');
		if ($pn.length) {
			loadPnMap();
			var descVal = ($form.find('.itemDescSelect').length ? $form.find('.itemDescSelect').val() : '');
			populatePnForTriplet($pn, type, $form.find('.itemMfgSelect').val(), descVal);
		}
	});

	// Initialize everything on DOM ready
	$(function(){
		loadMfgMap();
		loadPnMap();

		// if no mapping exists, there's nothing to populate — still set selects to disabled
		$('.itemTypeSelect').each(function(){
			var $t = $(this);
			var $form = $t.closest('form');
			var $mfg = $form.find('.itemMfgSelect');
			if (!$mfg.length) return;

			// If this form has hidden canonical values (edit flow), prefer them when initializing
			var hiddenType = ($form.find('.itemTypeHidden').length ? String($form.find('.itemTypeHidden').val() || '') : '');
			var hiddenMfg = ($form.find('.itemMfgHidden').length ? String($form.find('.itemMfgHidden').val() || '') : '');
			var hiddenDesc = ($form.find('.itemDescHidden').length ? String($form.find('.itemDescHidden').val() || '') : '');
			var hiddenPN = ($form.find('.itemPNHidden').length ? String($form.find('.itemPNHidden').val() || '') : '');

			// Set the item type select to the hidden value first (if present) so dependent population works
			if (hiddenType) {
				try { prefillSelectWithRetry($t, hiddenType); } catch (e) {}
			}

			var val = $t.val();
			populateMfgForType($mfg, val);

			// If there's a hiddenMfg (edit), select it in the new mfg options (use retry to survive re-inits)
			if (hiddenMfg) {
				try { prefillSelectWithRetry($mfg, hiddenMfg); } catch (e) {}
			}
			// ensure OTHER free input is enabled/disabled correctly
			var $other = $form.find('.itemMfgOther');
			if ($other.length) {
				if ($mfg.val() === 'OTHER') $other.prop('disabled', false).removeClass('disabled'); else $other.prop('disabled', true).addClass('disabled');
			}

			// ensure Item Type OTHER free input enabled/disabled correctly
			var $typeOther = $form.find('.itemTypeOther');
			if ($typeOther.length) {
				if ($t.val() === 'OTHER') $typeOther.prop('disabled', false).prop('required', true).removeClass('disabled'); else $typeOther.prop('disabled', true).prop('required', false).addClass('disabled');
			}

			// Also ensure manual MFG input is enabled/disabled initially
			var $mfgOtherInit = $form.find('.itemMfgOther');
			if ($mfgOtherInit.length) {
				if ($mfg.val() === 'OTHER') $mfgOtherInit.prop('disabled', false).removeClass('disabled'); else $mfgOtherInit.prop('disabled', true).prop('required', false).val('').addClass('disabled');
			}

			// Initialize description select visibility and options
			var $desc = $form.find('.itemDescSelect');
			if ($desc.length) {
				loadDescMap();
				populateDescForTypeMfg($desc, $t.val(), $mfg.val());
					// If hiddenDesc present, select it
					if (hiddenDesc) {
						try { prefillSelectWithRetry($desc, hiddenDesc); } catch (e) {}
					}
				var $descOtherInit = $form.find('.itemDescOther');
				if ($descOtherInit.length) {
					if ($desc.val() === 'OTHER') $descOtherInit.prop('disabled', false).prop('required', true).removeClass('disabled'); else $descOtherInit.prop('disabled', true).prop('required', false).val('').addClass('disabled');
				}
				// initialize PN select for this form
				var $pnInit = $form.find('.itemPNSelect');
				if ($pnInit.length) {
					loadPnMap();
					populatePnForTriplet($pnInit, $t.val(), $mfg.val(), $desc.val());
						// If hiddenPN present, select it (use retry helper)
						if (hiddenPN) {
							try { prefillSelectWithRetry($pnInit, hiddenPN); } catch (e) {}
						}
					var $pnOtherInit = $form.find('.itemPNOther');
					if ($pnOtherInit.length) {
						if ($pnInit.val() === 'OTHER') $pnOtherInit.prop('disabled', false).prop('required', true).removeClass('disabled'); else $pnOtherInit.prop('disabled', true).prop('required', false).val('').addClass('disabled');
					}
				}
			}

			// If any hidden canonical value was present, trigger change to ensure all downstreams update
			if (hiddenType || hiddenMfg || hiddenDesc || hiddenPN) {
				try { $t.trigger('change'); $mfg.trigger('change'); $desc.trigger('change'); } catch (e) {}
			}

			// Also attempt to initialize uncommon selects/inputs from canonical hidden fields
			try {
				var hiddenUnit = ($form.find('.unitOfIssueHidden').length ? String($form.find('.unitOfIssueHidden').val() || '') : '');
				var hiddenCat = ($form.find('.catCodeHidden').length ? String($form.find('.catCodeHidden').val() || '') : '');
				var hiddenClass = ($form.find('.classHidden').length ? String($form.find('.classHidden').val() || '') : '');
				var hiddenQty = ($form.find('.itemQtyHidden').length ? String($form.find('.itemQtyHidden').val() || '') : '');
				var hiddenShip = ($form.find('.shipLooseHidden').length ? String($form.find('.shipLooseHidden').val() || '') : '');
				var hiddenSec = ($form.find('.secIDHidden').length ? String($form.find('.secIDHidden').val() || '') : '');

				// unitOfIssue select
				var $unit = $form.find('.unitOfIssueSelect');
				if (hiddenUnit && $unit.length) {
					try { prefillSelectWithRetry($unit, hiddenUnit); } catch (e) {}
				}
				// catCode select
				var $cat = $form.find('.catCodeSelect');
				if (hiddenCat && $cat.length) {
					try { prefillSelectWithRetry($cat, hiddenCat); } catch (e) {}
				}
				// class select
				var $cls = $form.find('.classSelect');
				if (hiddenClass && $cls.length) {
					try { prefillSelectWithRetry($cls, hiddenClass); } catch (e) {}
				}
				// qty input
				var $qty = $form.find('.itemQtyInput');
				if (hiddenQty && $qty.length) {
					try { $qty.val(hiddenQty); } catch (e) {}
				}
				// ship loose checkbox
				var $ship = $form.find('input[name="shipLoose"]');
				if (hiddenShip && $ship.length) {
					try { $ship.prop('checked', String(hiddenShip).toUpperCase() === 'Y'); } catch (e) {}
				}
				// secID select
				var $sec = $form.find('.itemSectionSelect');
				if (hiddenSec && $sec.length) {
					try { prefillSelectWithRetry($sec, hiddenSec); } catch (e) {}
				}
				// ensure UI updates
				try { if ($unit.length) triggerSelect2($unit); if ($cat.length) triggerSelect2($cat); if ($cls.length) triggerSelect2($cls); } catch (e) {}
			} catch(e) {}
		});

		// Add minimal CSS if page doesn't define it — makes disabled selects look grayed
		if ($('head style#mbf-mfg-style').length === 0) {
			var css = '.mfg-disabled { opacity: .65; } .mfg-disabled ~ .select2-container { opacity: .65; pointer-events: none; }';
			$('<style id="mbf-mfg-style">' + css + '</style>').appendTo('head');
		}
	});

	// Also attempt a re-initialization on window.load to handle cases where Select2
	// initializes after DOM ready and may override disabled/option state.
	window.addEventListener('load', function(){
		loadMfgMap();
		loadDescMap();
		loadPnMap();
		$('.itemTypeSelect').each(function(){
			var $t = $(this);
			var $form = $t.closest('form');
			var $mfg = $form.find('.itemMfgSelect');
			if (!$mfg.length) return;
			populateMfgForType($mfg, $t.val());
			// also populate description selects
			var $desc = $form.find('.itemDescSelect');
			if ($desc.length) populateDescForTypeMfg($desc, $t.val(), $mfg.val());
			// also populate PN selects
			var $pn = $form.find('.itemPNSelect');
			if ($pn.length) populatePnForTriplet($pn, $t.val(), $mfg.val(), ($desc.length ? $desc.val() : ''));
			// Update P/N row after window.load population
			updatePnRow($form);
		});
	});

	/* Additional UI wiring moved from templates into this shared asset:
	 - Uncommon row visibility (shows when any primary field is OTHER or has manual text)
	 - Assign-section row toggles (show/hide, check/uncheck all, disable ship-loose)
	 - Form validation helper for Add-Item forms (check select or OTHER has value)
	 - Pre-submit copy for edit forms that use hidden fields (.itemTypeHidden etc)
	*/

	function initUncommonRow() {
		function updateUncommonForForm($form) {
			var show = false;
			var t = $form.find('.itemTypeSelect').val();
			var m = $form.find('.itemMfgSelect').val();
			var d = $form.find('.itemDescSelect').val();
			var p = $form.find('.itemPNSelect').val();
			if (t === 'OTHER' || m === 'OTHER' || d === 'OTHER' || p === 'OTHER') show = true;
			var $typeOther = $form.find('.itemTypeOther'); if ($typeOther.length && $typeOther.val() && $typeOther.val().trim() !== '') show = true;
			var $mfgOther = $form.find('.itemMfgOther'); if ($mfgOther.length && $mfgOther.val() && $mfgOther.val().trim() !== '') show = true;
			var $descOther = $form.find('.itemDescOther'); if ($descOther.length && $descOther.val() && $descOther.val().trim() !== '') show = true;
			var $pnOther = $form.find('.itemPNOther'); if ($pnOther.length && $pnOther.val() && $pnOther.val().trim() !== '') show = true;
			var $row = $form.find('#uncommonRow');
			if (!$row || $row.length === 0) $row = $('#uncommonRow');
			if ($row.length) { $row.toggle(show); }

			// Toggle Unit / Cat / Class selects required/disabled state so
			// HTML5 validation doesn't block submission while the row is hidden.
			var $unit = $row.find('.unitOfIssueSelect');
			var $cat = $row.find('.catCodeSelect');
			var $cls = $row.find('.classSelect');
			if (show) {
				if ($unit.length) { $unit.prop('disabled', false).prop('required', true).removeClass('disabled'); }
				if ($cat.length)  { $cat.prop('disabled', false).prop('required', true).removeClass('disabled'); }
				if ($cls.length)  { $cls.prop('disabled', false).prop('required', true).removeClass('disabled'); }
			} else {
				if ($unit.length) { $unit.prop('disabled', true).prop('required', false).val('').addClass('disabled'); }
				if ($cat.length)  { $cat.prop('disabled', true).prop('required', false).val('').addClass('disabled'); }
				if ($cls.length)  { $cls.prop('disabled', true).prop('required', false).val('').addClass('disabled'); }
			}
			// If these are Select2-enhanced, update their UI
			try { if ($unit.length) triggerSelect2($unit); if ($cat.length) triggerSelect2($cat); if ($cls.length) triggerSelect2($cls); } catch (e) {}
		}

		$(document).on('change input', '.itemTypeSelect, .itemMfgSelect, .itemDescSelect, .itemPNSelect, .itemTypeOther, .itemMfgOther, .itemDescOther, .itemPNOther', function(){
			var $form = $(this).closest('form'); if (!$form.length) $form = $(document);
			updateUncommonForForm($form);
		});

		// initial pass for existing forms
		$('form').each(function(){ updateUncommonForForm($(this)); });
	}

	function initAssignSection() {
		function updateAssignState($sel) {
			var $form = $sel.closest('form');
			var val = $sel.val();
			var $assignRow = $('#assignSection');
			var $checkAllCol = $('#checkAllCol');
			var $uncheckAllCol = $('#uncheckAllCol');
			// find a ship-loose checkbox: prefer form-local editShipLoose, then generic shipLoose, then global id
			var $ship = $form.find('input[name="editShipLoose"], input[name="shipLoose"]').add('#shipLooseCheckbox');
			// normalize to first element or null
			var shipLoose = ($ship && $ship.length) ? $ship.get(0) : null;

			if (val === 'assign') {
				if ($assignRow.length) $assignRow.show();
				if ($checkAllCol.length) $checkAllCol.show();
				if ($uncheckAllCol.length) $uncheckAllCol.show();
				if (shipLoose) { shipLoose.disabled = true; shipLoose.checked = false; }
			} else {
				if ($assignRow.length) $assignRow.hide();
				if ($checkAllCol.length) $checkAllCol.hide();
				if ($uncheckAllCol.length) $uncheckAllCol.hide();
				// clear checks
				$assignRow.find('input[type=checkbox]').prop('checked', false);
				// If a specific section was selected (non-empty), disable ship-loose; if Unassigned (empty), enable it.
				if (shipLoose) {
					if (val && String(val).trim() !== '') {
						shipLoose.disabled = true;
						shipLoose.checked = false;
					} else {
						shipLoose.disabled = false;
					}
				}
			}
		}

		$(document).on('change', '.itemSectionSelect', function(){
			var $sel = $(this);
			updateAssignState($sel);

			// If this select is part of an item edit form, attempt to persist the change
			var $form = $sel.closest('form');
			if ($form.length) {
				var itemSumID = $form.find('input[name="itemSumID"]').val();
				var mbomID = $form.find('input[name="mbomID"]').val();
				var secID = $sel.val() || null;
				if (itemSumID) {
					// POST to endpoint to update the item row's section
					try {
						$.post('/updateItemSection', { itemSumID: itemSumID, secID: secID, mbomID: mbomID })
							.done(function(resp){
								if (!resp || !resp.success) {
									console.warn('updateItemSection failed', resp);
								}
							})
							.fail(function(err){
								console.error('updateItemSection error', err);
							});
					} catch (e) { console.error('updateItemSection post failed', e); }
				}
			}
		});
		$(document).on('click', '#checkAllBtn', function(){ $('#assignSection').find('input[type=checkbox]').prop('checked', true); });
		$(document).on('click', '#uncheckAllBtn', function(){ $('#assignSection').find('input[type=checkbox]').prop('checked', false); });

		// initial update
		$('.itemSectionSelect').each(function(){ updateAssignState($(this)); });
	}

	function initFormValidationAndSubmitCopy() {
		function clearCustom(el){ try{ if(el && el.setCustomValidity) el.setCustomValidity(''); } catch(e){} }

		function checkSelectOrOther(sel, other, friendlyName){
			clearCustom(sel); clearCustom(other);
			if (!sel) return true;
			var val = String(sel.value || '').trim();
			if (val === ''){
				if (other && other.value && other.value.trim() !== '') return true;
				try{ if (sel.setCustomValidity) sel.setCustomValidity('Please select a ' + friendlyName + ' or enter one.'); }catch(e){}
				return false;
			}
			if (val === 'OTHER'){
				if (!other || !other.value || other.value.trim() === ''){
					try{ if (other && other.setCustomValidity) other.setCustomValidity('Please enter a value for ' + friendlyName + ' when OTHER is selected.'); }catch(e){}
					return false;
				}
			}
			return true;
		}

		// Add-Item form validation (same behavior as previous inline script)
		$(document).on('submit', '#addItemForm', function(ev){
			var form = this;
			var typeOk = checkSelectOrOther(form.querySelector('.itemTypeSelect'), form.querySelector('.itemTypeOther'), 'Item Type');
			var mfgOk  = checkSelectOrOther(form.querySelector('.itemMfgSelect'), form.querySelector('.itemMfgOther'), 'Item Manufacturer');
			var descOk = checkSelectOrOther(form.querySelector('.itemDescSelect'), form.querySelector('.itemDescOther'), 'Description');
			var pnOk   = checkSelectOrOther(form.querySelector('.itemPNSelect'), form.querySelector('.itemPNOther'), 'Item P/N');
			var browserValid = form.checkValidity ? form.checkValidity() : true;
			if (!(typeOk && mfgOk && descOk && pnOk && browserValid)){
				ev.preventDefault(); ev.stopPropagation();
				form.classList.add('was-validated');
				var firstInvalid = form.querySelector(':invalid'); if (firstInvalid && typeof firstInvalid.focus === 'function') try{ firstInvalid.focus(); }catch(e){}
				return false;
			}
			form.classList.add('was-validated');
		});

		// Pre-submit copy for edit forms that use hidden fields named .itemTypeHidden/.itemMfgHidden/.itemDescHidden/.itemPNHidden
		$(document).on('submit', '.itemForm', function(){
			var $form = $(this);
			// itemType
			var hiddenType = $form.find('.itemTypeHidden');
			var typeSel = $form.find('.itemTypeSelect');
			var typeOther = $form.find('.itemTypeOther');
			if (hiddenType.length){
				if (typeSel.length && typeSel.val() === 'OTHER' && typeOther.length && typeOther.val().trim()) hiddenType.val(typeOther.val().trim());
				else if (typeSel.length) hiddenType.val(typeSel.val() || '');
			}
			// itemMfg
			var hiddenMfg = $form.find('.itemMfgHidden');
			var mfgSel = $form.find('.itemMfgSelect');
			var mfgOther = $form.find('.itemMfgOther');
			if (hiddenMfg.length){
				if (mfgSel.length && (mfgSel.val() === 'OTHER' || String(mfgSel.val()).endsWith('|OTHER')) && mfgOther.length && mfgOther.val().trim()) hiddenMfg.val(mfgOther.val().trim());
				else if (mfgSel.length){ var parts = String(mfgSel.val()).split('|'); hiddenMfg.val(parts.length>1? parts[1] : mfgSel.val()); }
			}
			// itemDesc
			var hiddenDesc = $form.find('.itemDescHidden');
			var descSel = $form.find('.itemDescSelect');
			var descOther = $form.find('.itemDescOther');
			if (hiddenDesc.length){
				if (descSel.length && descSel.val() === 'OTHER' && descOther.length && descOther.val().trim()) hiddenDesc.val(descOther.val().trim());
				else if (descSel.length){ var parts = String(descSel.val()).split('|'); hiddenDesc.val(parts.slice(2).join('|') || descSel.val()); }
			}
			// itemPN
			var hiddenPN = $form.find('.itemPNHidden');
			var pnSel = $form.find('.itemPNSelect');
			var pnOther = $form.find('.itemPNOther');
			if (hiddenPN.length){
				if (pnSel.length && pnSel.val() === 'OTHER' && pnOther.length && pnOther.val().trim()) hiddenPN.val(pnOther.val().trim());
				else if (pnSel.length){ var parts = String(pnSel.val()).split('|'); hiddenPN.val(parts.slice(3).join('|') || pnSel.val()); }
			}
		});
	}

	// wire additional features on DOM ready
	$(function(){
		initUncommonRow();
		initAssignSection();
		initFormValidationAndSubmitCopy();
	});

})(jQuery);

