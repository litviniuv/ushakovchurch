/*
  Narrow screens only. Restacks absolutely positioned blocks into the
  desktop reading order (top, then left). Does not run at 1024px and wider.
*/
(function () {
	var query = window.matchMedia("(max-width: 1023px)");

	function positionsFromStylesheets() {
		var map = {};
		var sheets = document.styleSheets;
		for (var i = 0; i < sheets.length; i++) {
			var rules;
			try {
				rules = sheets[i].cssRules;
			} catch (err) {
				continue;
			}
			if (!rules) continue;
			for (var j = 0; j < rules.length; j++) {
				var rule = rules[j];
				if (!rule.selectorText || !rule.style) continue;
				if (!/^#wb_element_instance\d+$/.test(rule.selectorText)) continue;
				var top = rule.style.getPropertyValue("top");
				var left = rule.style.getPropertyValue("left");
				if (!top && !left) continue;
				map[rule.selectorText.slice(1)] = {
					top: parseFloat(top) || 0,
					left: parseFloat(left) || 0
				};
			}
		}
		return map;
	}

	function stackMain() {
		var main = document.querySelector("#wb_main > .wb_cont_inner");
		if (!main) return;
		var map = positionsFromStylesheets();
		var items = [];
		var children = main.children;
		for (var i = 0; i < children.length; i++) {
			var el = children[i];
			var pos = map[el.id];
			if (!pos) continue;
			items.push({ el: el, top: pos.top, left: pos.left });
		}
		items.sort(function (a, b) {
			return a.top - b.top || a.left - b.left;
		});
		var rows = [];
		for (var n = 0; n < items.length; n++) {
			var item = items[n];
			var row = rows.length ? rows[rows.length - 1] : null;
			if (row && Math.abs(item.top - row.top) <= 36) {
				row.items.push(item);
			} else {
				rows.push({ top: item.top, items: [item] });
			}
		}
		var order = 0;
		for (var r = 0; r < rows.length; r++) {
			rows[r].items.sort(function (a, b) {
				return a.left - b.left;
			});
			for (var k = 0; k < rows[r].items.length; k++) {
				rows[r].items[k].el.style.order = String(order++);
			}
		}
	}

	function setupMenu() {
		var menus = document.querySelectorAll("#wb_header .wb-menu");
		for (var i = 0; i < menus.length; i++) {
			var menu = menus[i];
			if (menu.querySelector(".wb-mobile-toggle")) continue;
			var button = document.createElement("button");
			button.type = "button";
			button.className = "wb-mobile-toggle";
			button.setAttribute("aria-expanded", "false");
			button.innerHTML = '<span class="wb-mobile-toggle-bars" aria-hidden="true"><span></span><span></span><span></span></span><span class="wb-mobile-toggle-label">Меню</span>';
			menu.insertBefore(button, menu.firstChild);
			button.addEventListener("click", function (event) {
				var current = event.currentTarget.parentNode;
				var open = current.classList.toggle("wb-mobile-open");
				event.currentTarget.setAttribute("aria-expanded", open ? "true" : "false");
			});
		}
	}

	function allowMenuLinks() {
		if (!window.jQuery) return;
		window.jQuery("#wb_header .wb-menu > ul").off("touchstart");
	}

	function apply() {
		if (!query.matches) return;
		stackMain();
		setupMenu();
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", allowMenuLinks);
		} else {
			allowMenuLinks();
		}
	}

	apply();
})();
