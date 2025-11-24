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
			var val = $t.val();
			populateMfgForType($mfg, val);
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
				var $descOtherInit = $form.find('.itemDescOther');
				if ($descOtherInit.length) {
					if ($desc.val() === 'OTHER') $descOtherInit.prop('disabled', false).prop('required', true).removeClass('disabled'); else $descOtherInit.prop('disabled', true).prop('required', false).val('').addClass('disabled');
				}
				// initialize PN select for this form
				var $pnInit = $form.find('.itemPNSelect');
				if ($pnInit.length) {
					loadPnMap();
					populatePnForTriplet($pnInit, $t.val(), $mfg.val(), $desc.val());
					var $pnOtherInit = $form.find('.itemPNOther');
					if ($pnOtherInit.length) {
						if ($pnInit.val() === 'OTHER') $pnOtherInit.prop('disabled', false).prop('required', true).removeClass('disabled'); else $pnOtherInit.prop('disabled', true).prop('required', false).val('').addClass('disabled');
					}
				}
			}
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

})(jQuery);

