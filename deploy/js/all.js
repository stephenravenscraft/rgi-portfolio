/*
*   This content is licensed according to the W3C Software License at
*   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
*/
var MenubarItem = function (domNode, menuObj) {

  this.menu = menuObj;
  this.domNode = domNode;
  this.popupMenu = false;

  this.hasFocus = false;
  this.hasHover = false;

  this.isMenubarItem = true;

  this.keyCode = Object.freeze({
    'TAB': 9,
    'RETURN': 13,
    'ESC': 27,
    'SPACE': 32,
    'PAGEUP': 33,
    'PAGEDOWN': 34,
    'END': 35,
    'HOME': 36,
    'LEFT': 37,
    'UP': 38,
    'RIGHT': 39,
    'DOWN': 40
  });
};

MenubarItem.prototype.init = function () {
  this.domNode.tabIndex = -1;

  this.domNode.addEventListener('keydown', this.handleKeydown.bind(this));
  this.domNode.addEventListener('focus', this.handleFocus.bind(this));
  this.domNode.addEventListener('blur', this.handleBlur.bind(this));
  this.domNode.addEventListener('mouseover', this.handleMouseover.bind(this));
  this.domNode.addEventListener('mouseout', this.handleMouseout.bind(this));

  // Initialize pop up menus

  var nextElement = this.domNode.nextElementSibling;

  if (nextElement && nextElement.tagName === 'UL') {
    this.popupMenu = new PopupMenu(nextElement, this);
    this.popupMenu.init();
  }

};

MenubarItem.prototype.handleKeydown = function (event) {
  var tgt = event.currentTarget,
    char = event.key,
    flag = false,
    clickEvent;

  function isPrintableCharacter (str) {
    return str.length === 1 && str.match(/\S/);
  }

  switch (event.keyCode) {
    case this.keyCode.SPACE:
    case this.keyCode.RETURN:
    case this.keyCode.DOWN:
      if (this.popupMenu) {
        this.popupMenu.open();
        this.popupMenu.setFocusToFirstItem();
        flag = true;
      }
      break;

    case this.keyCode.LEFT:
      this.menu.setFocusToPreviousItem(this);
      flag = true;
      break;

    case this.keyCode.RIGHT:
      this.menu.setFocusToNextItem(this);
      flag = true;
      break;

    case this.keyCode.UP:
      if (this.popupMenu) {
        this.popupMenu.open();
        this.popupMenu.setFocusToLastItem();
        flag = true;
      }
      break;

    case this.keyCode.HOME:
    case this.keyCode.PAGEUP:
      this.menu.setFocusToFirstItem();
      flag = true;
      break;

    case this.keyCode.END:
    case this.keyCode.PAGEDOWN:
      this.menu.setFocusToLastItem();
      flag = true;
      break;

    case this.keyCode.TAB:
      this.popupMenu.close(true);
      break;

    case this.keyCode.ESC:
      this.popupMenu.close(true);
      break;

    default:
      if (isPrintableCharacter(char)) {
        this.menu.setFocusByFirstCharacter(this, char);
        flag = true;
      }
      break;
  }

  if (flag) {
    event.stopPropagation();
    event.preventDefault();
  }
};

MenubarItem.prototype.setExpanded = function (value) {
  if (value) {
    this.domNode.setAttribute('aria-expanded', 'true');
  }
  else {
    this.domNode.setAttribute('aria-expanded', 'false');
  }
};

MenubarItem.prototype.handleFocus = function (event) {
  this.menu.hasFocus = true;
};

MenubarItem.prototype.handleBlur = function (event) {
  this.menu.hasFocus = false;
};

MenubarItem.prototype.handleMouseover = function (event) {
  this.hasHover = true;
  this.popupMenu.open();
};

MenubarItem.prototype.handleMouseout = function (event) {
  this.hasHover = false;
  setTimeout(this.popupMenu.close.bind(this.popupMenu, false), 300);
};
/*
*   This content is licensed according to the W3C Software License at
*   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
*/

var Menubar = function (domNode) {
  var elementChildren,
    msgPrefix = 'Menubar constructor argument menubarNode ';

  // Check whether menubarNode is a DOM element
  if (!domNode instanceof Element) {
    throw new TypeError(msgPrefix + 'is not a DOM Element.');
  }

  // Check whether menubarNode has descendant elements
  if (domNode.childElementCount === 0) {
    throw new Error(msgPrefix + 'has no element children.');
  }

  // Check whether menubarNode has A elements
  e = domNode.firstElementChild;
  while (e) {
    var menubarItem = e.firstElementChild;
    if (e && menubarItem && menubarItem.tagName !== 'A') {
      throw new Error(msgPrefix + 'has child elements are not A elements.');
    }
    e = e.nextElementSibling;
  }

  this.isMenubar = true;

  this.domNode = domNode;

  this.menubarItems = []; // See Menubar init method
  this.firstChars = []; // See Menubar init method

  this.firstItem = null; // See Menubar init method
  this.lastItem = null; // See Menubar init method

  this.hasFocus = false; // See MenubarItem handleFocus, handleBlur
  this.hasHover = false; // See Menubar handleMouseover, handleMouseout
};

/*
*   @method Menubar.prototype.init
*
*   @desc
*       Adds ARIA role to the menubar node
*       Traverse menubar children for A elements to configure each A element as a ARIA menuitem
*       and populate menuitems array. Initialize firstItem and lastItem properties.
*/
Menubar.prototype.init = function () {
  var menubarItem, childElement, menuElement, textContent, numItems;


  // Traverse the element children of menubarNode: configure each with
  // menuitem role behavior and store reference in menuitems array.
  elem = this.domNode.firstElementChild;

  while (elem) {
    var menuElement = elem.firstElementChild;

    if (elem && menuElement && menuElement.tagName === 'A') {
      menubarItem = new MenubarItem(menuElement, this);
      menubarItem.init();
      this.menubarItems.push(menubarItem);
      textContent = menuElement.textContent.trim();
      this.firstChars.push(textContent.substring(0, 1).toLowerCase());
    }

    elem = elem.nextElementSibling;
  }

  // Use populated menuitems array to initialize firstItem and lastItem.
  numItems = this.menubarItems.length;
  if (numItems > 0) {
    this.firstItem = this.menubarItems[ 0 ];
    this.lastItem = this.menubarItems[ numItems - 1 ];
  }
  this.firstItem.domNode.tabIndex = 0;
};

/* FOCUS MANAGEMENT METHODS */

Menubar.prototype.setFocusToItem = function (newItem) {

  var flag = false;

  for (var i = 0; i < this.menubarItems.length; i++) {
    var mbi = this.menubarItems[i];

    if (mbi.domNode.tabIndex == 0) {
      flag = mbi.domNode.getAttribute('aria-expanded') === 'true';
    }

    mbi.domNode.tabIndex = -1;
    if (mbi.popupMenu) {
      mbi.popupMenu.close();
    }
  }

  newItem.domNode.focus();
  newItem.domNode.tabIndex = 0;

  if (flag && newItem.popupMenu) {
    newItem.popupMenu.open();
  }
};

Menubar.prototype.setFocusToFirstItem = function (flag) {
  this.setFocusToItem(this.firstItem);
};

Menubar.prototype.setFocusToLastItem = function (flag) {
  this.setFocusToItem(this.lastItem);
};

Menubar.prototype.setFocusToPreviousItem = function (currentItem) {
  var index;

  if (currentItem === this.firstItem) {
    newItem = this.lastItem;
  }
  else {
    index = this.menubarItems.indexOf(currentItem);
    newItem = this.menubarItems[ index - 1 ];
  }

  this.setFocusToItem(newItem);

};

Menubar.prototype.setFocusToNextItem = function (currentItem) {
  var index;

  if (currentItem === this.lastItem) {
    newItem = this.firstItem;
  }
  else {
    index = this.menubarItems.indexOf(currentItem);
    newItem = this.menubarItems[ index + 1 ];
  }

  this.setFocusToItem(newItem);

};

Menubar.prototype.setFocusByFirstCharacter = function (currentItem, char) {
  var start, index, char = char.toLowerCase();
  var flag = currentItem.domNode.getAttribute('aria-expanded') === 'true';

  // Get start index for search based on position of currentItem
  start = this.menubarItems.indexOf(currentItem) + 1;
  if (start === this.menubarItems.length) {
    start = 0;
  }

  // Check remaining slots in the menu
  index = this.getIndexFirstChars(start, char);

  // If not found in remaining slots, check from beginning
  if (index === -1) {
    index = this.getIndexFirstChars(0, char);
  }

  // If match was found...
  if (index > -1) {
    this.setFocusToItem(this.menubarItems[ index ]);
  }
};

Menubar.prototype.getIndexFirstChars = function (startIndex, char) {
  for (var i = startIndex; i < this.firstChars.length; i++) {
    if (char === this.firstChars[ i ]) {
      return i;
    }
  }
  return -1;
};

/*
*   This content is licensed according to the W3C Software License at
*   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
*/
var MenuItem = function (domNode, menuObj) {

  if (typeof popupObj !== 'object') {
    popupObj = false;
  }

  this.domNode = domNode;
  this.menu = menuObj;
  this.popupMenu = false;
  this.isMenubarItem = false;

  this.keyCode = Object.freeze({
    'TAB': 9,
    'RETURN': 13,
    'ESC': 27,
    'SPACE': 32,
    'PAGEUP': 33,
    'PAGEDOWN': 34,
    'END': 35,
    'HOME': 36,
    'LEFT': 37,
    'UP': 38,
    'RIGHT': 39,
    'DOWN': 40
  });
};

MenuItem.prototype.init = function () {
  this.domNode.tabIndex = -1;

  this.domNode.addEventListener('keydown', this.handleKeydown.bind(this));
  this.domNode.addEventListener('click', this.handleClick.bind(this));
  this.domNode.addEventListener('focus', this.handleFocus.bind(this));
  this.domNode.addEventListener('blur', this.handleBlur.bind(this));
  this.domNode.addEventListener('mouseover', this.handleMouseover.bind(this));
  this.domNode.addEventListener('mouseout', this.handleMouseout.bind(this));

  // Initialize flyout menu

  var nextElement = this.domNode.nextElementSibling;

  if (nextElement && nextElement.tagName === 'UL') {
    this.popupMenu = new PopupMenu(nextElement, this);
    this.popupMenu.init();
  }

};

MenuItem.prototype.isExpanded = function () {
  return this.domNode.getAttribute('aria-expanded') === 'true';
};

/* EVENT HANDLERS */

MenuItem.prototype.handleKeydown = function (event) {
  var tgt  = event.currentTarget,
    char = event.key,
    flag = false,
    clickEvent;

  function isPrintableCharacter (str) {
    return str.length === 1 && str.match(/\S/);
  }

  switch (event.keyCode) {
    case this.keyCode.SPACE:
    case this.keyCode.RETURN:
      if (this.popupMenu) {
        this.popupMenu.open();
        this.popupMenu.setFocusToFirstItem();
      }
      else {

        // Create simulated mouse event to mimic the behavior of ATs
        // and let the event handler handleClick do the housekeeping.
        try {
          clickEvent = new MouseEvent('click', {
            'view': window,
            'bubbles': true,
            'cancelable': true
          });
        }
        catch (err) {
          if (document.createEvent) {
            // DOM Level 3 for IE 9+
            clickEvent = document.createEvent('MouseEvents');
            clickEvent.initEvent('click', true, true);
          }
        }
        tgt.dispatchEvent(clickEvent);
      }

      flag = true;
      break;

    case this.keyCode.UP:
      this.menu.setFocusToPreviousItem(this);
      flag = true;
      break;

    case this.keyCode.DOWN:
      this.menu.setFocusToNextItem(this);
      flag = true;
      break;

    case this.keyCode.LEFT:
      this.menu.setFocusToController('previous', true);
      this.menu.close(true);
      flag = true;
      break;

    case this.keyCode.RIGHT:
      if (this.popupMenu) {
        this.popupMenu.open();
        this.popupMenu.setFocusToFirstItem();
      }
      else {
        this.menu.setFocusToController('next', true);
        this.menu.close(true);
      }
      flag = true;
      break;

    case this.keyCode.HOME:
    case this.keyCode.PAGEUP:
      this.menu.setFocusToFirstItem();
      flag = true;
      break;

    case this.keyCode.END:
    case this.keyCode.PAGEDOWN:
      this.menu.setFocusToLastItem();
      flag = true;
      break;

    case this.keyCode.ESC:
      this.menu.setFocusToController();
      this.menu.close(true);
      flag = true;
      break;

    case this.keyCode.TAB:
      this.menu.setFocusToController();
      break;

    default:
      if (isPrintableCharacter(char)) {
        this.menu.setFocusByFirstCharacter(this, char);
        flag = true;
      }
      break;
  }

  if (flag) {
    event.stopPropagation();
    event.preventDefault();
  }
};

MenuItem.prototype.setExpanded = function (value) {
  if (value) {
    this.domNode.setAttribute('aria-expanded', 'true');
  }
  else {
    this.domNode.setAttribute('aria-expanded', 'false');
  }
};

MenuItem.prototype.handleClick = function (event) {
  this.menu.setFocusToController();
  this.menu.close(true);
};

MenuItem.prototype.handleFocus = function (event) {
  this.menu.hasFocus = true;
};

MenuItem.prototype.handleBlur = function (event) {
  this.menu.hasFocus = false;
  setTimeout(this.menu.close.bind(this.menu, false), 300);
};

MenuItem.prototype.handleMouseover = function (event) {
  this.menu.hasHover = true;
  this.menu.open();
  if (this.popupMenu) {
    this.popupMenu.hasHover = true;
    this.popupMenu.open();
  }
};

MenuItem.prototype.handleMouseout = function (event) {
  if (this.popupMenu) {
    this.popupMenu.hasHover = false;
    this.popupMenu.close(true);
  }

  this.menu.hasHover = false;
  setTimeout(this.menu.close.bind(this.menu, false), 300);
};
/*
*   This content is licensed according to the W3C Software License at
*   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
*/
var PopupMenu = function (domNode, controllerObj) {
  var elementChildren,
    msgPrefix = 'PopupMenu constructor argument domNode ';

  // Check whether domNode is a DOM element
  if (!domNode instanceof Element) {
    throw new TypeError(msgPrefix + 'is not a DOM Element.');
  }
  // Check whether domNode has child elements
  if (domNode.childElementCount === 0) {
    throw new Error(msgPrefix + 'has no element children.');
  }
  // Check whether domNode descendant elements have A elements
  var childElement = domNode.firstElementChild;
  while (childElement) {
    var menuitem = childElement.firstElementChild;
    if (menuitem && menuitem === 'A') {
      throw new Error(msgPrefix + 'has descendant elements that are not A elements.');
    }
    childElement = childElement.nextElementSibling;
  }

  this.isMenubar = false;

  this.domNode    = domNode;
  this.controller = controllerObj;

  this.menuitems = []; // See PopupMenu init method
  this.firstChars = []; // See PopupMenu init method

  this.firstItem = null; // See PopupMenu init method
  this.lastItem = null; // See PopupMenu init method

  this.hasFocus = false; // See MenuItem handleFocus, handleBlur
  this.hasHover = false; // See PopupMenu handleMouseover, handleMouseout
};

/*
*   @method PopupMenu.prototype.init
*
*   @desc
*       Add domNode event listeners for mouseover and mouseout. Traverse
*       domNode children to configure each menuitem and populate menuitems
*       array. Initialize firstItem and lastItem properties.
*/
PopupMenu.prototype.init = function () {
  var childElement, menuElement, menuItem, textContent, numItems, label;

  // Configure the domNode itself

  this.domNode.addEventListener('mouseover', this.handleMouseover.bind(this));
  this.domNode.addEventListener('mouseout', this.handleMouseout.bind(this));

  // Traverse the element children of domNode: configure each with
  // menuitem role behavior and store reference in menuitems array.
  childElement = this.domNode.firstElementChild;

  while (childElement) {
    menuElement = childElement.firstElementChild;

    if (menuElement && menuElement.tagName === 'A') {
      menuItem = new MenuItem(menuElement, this);
      menuItem.init();
      this.menuitems.push(menuItem);
      textContent = menuElement.textContent.trim();
      this.firstChars.push(textContent.substring(0, 1).toLowerCase());
    }
    childElement = childElement.nextElementSibling;
  }

  // Use populated menuitems array to initialize firstItem and lastItem.
  numItems = this.menuitems.length;
  if (numItems > 0) {
    this.firstItem = this.menuitems[ 0 ];
    this.lastItem = this.menuitems[ numItems - 1 ];
  }
};

/* EVENT HANDLERS */

PopupMenu.prototype.handleMouseover = function (event) {
  this.hasHover = true;
};

PopupMenu.prototype.handleMouseout = function (event) {
  this.hasHover = false;
  setTimeout(this.close.bind(this, false), 1);
};

/* FOCUS MANAGEMENT METHODS */

PopupMenu.prototype.setFocusToController = function (command, flag) {

  if (typeof command !== 'string') {
    command = '';
  }

  function setFocusToMenubarItem (controller, close) {
    while (controller) {
      if (controller.isMenubarItem) {
        controller.domNode.focus();
        return controller;
      }
      else {
        if (close) {
          controller.menu.close(true);
        }
        controller.hasFocus = false;
      }
      controller = controller.menu.controller;
    }
    return false;
  }

  if (command === '') {
    if (this.controller && this.controller.domNode) {
      this.controller.domNode.focus();
    }
    return;
  }

  if (!this.controller.isMenubarItem) {
    this.controller.domNode.focus();
    this.close();

    if (command === 'next') {
      var menubarItem = setFocusToMenubarItem(this.controller, false);
      if (menubarItem) {
        menubarItem.menu.setFocusToNextItem(menubarItem, flag);
      }
    }
  }
  else {
    if (command === 'previous') {
      this.controller.menu.setFocusToPreviousItem(this.controller, flag);
    }
    else if (command === 'next') {
      this.controller.menu.setFocusToNextItem(this.controller, flag);
    }
  }

};

PopupMenu.prototype.setFocusToFirstItem = function () {
  this.firstItem.domNode.focus();
};

PopupMenu.prototype.setFocusToLastItem = function () {
  this.lastItem.domNode.focus();
};

PopupMenu.prototype.setFocusToPreviousItem = function (currentItem) {
  var index;

  if (currentItem === this.firstItem) {
    this.lastItem.domNode.focus();
  }
  else {
    index = this.menuitems.indexOf(currentItem);
    this.menuitems[ index - 1 ].domNode.focus();
  }
};

PopupMenu.prototype.setFocusToNextItem = function (currentItem) {
  var index;

  if (currentItem === this.lastItem) {
    this.firstItem.domNode.focus();
  }
  else {
    index = this.menuitems.indexOf(currentItem);
    this.menuitems[ index + 1 ].domNode.focus();
  }
};

PopupMenu.prototype.setFocusByFirstCharacter = function (currentItem, char) {
  var start, index, char = char.toLowerCase();

  // Get start index for search based on position of currentItem
  start = this.menuitems.indexOf(currentItem) + 1;
  if (start === this.menuitems.length) {
    start = 0;
  }

  // Check remaining slots in the menu
  index = this.getIndexFirstChars(start, char);

  // If not found in remaining slots, check from beginning
  if (index === -1) {
    index = this.getIndexFirstChars(0, char);
  }

  // If match was found...
  if (index > -1) {
    this.menuitems[ index ].domNode.focus();
  }
};

PopupMenu.prototype.getIndexFirstChars = function (startIndex, char) {
  for (var i = startIndex; i < this.firstChars.length; i++) {
    if (char === this.firstChars[ i ]) {
      return i;
    }
  }
  return -1;
};

/* MENU DISPLAY METHODS */

PopupMenu.prototype.open = function () {
  // Get position and bounding rectangle of controller object's DOM node
  var rect = this.controller.domNode.getBoundingClientRect();

  // Set CSS properties
  if (!this.controller.isMenubarItem) {
    this.domNode.parentNode.style.position = 'relative';
    this.domNode.style.display = 'block';
    this.domNode.style.position = 'absolute';
    this.domNode.style.left = rect.width + 'px';
    this.domNode.style.zIndex = 100;
  }
  else {
    this.domNode.style.display = 'block';
    this.domNode.style.position = 'absolute';
    this.domNode.style.top = (rect.height - 1) + 'px';
    this.domNode.style.zIndex = 100;
  }

  this.controller.setExpanded(true);

};

PopupMenu.prototype.close = function (force) {

  var controllerHasHover = this.controller.hasHover;

  var hasFocus = this.hasFocus;

  for (var i = 0; i < this.menuitems.length; i++) {
    var mi = this.menuitems[i];
    if (mi.popupMenu) {
      hasFocus = hasFocus | mi.popupMenu.hasFocus;
    }
  }

  if (!this.controller.isMenubarItem) {
    controllerHasHover = false;
  }

  if (force || (!hasFocus && !this.hasHover && !controllerHasHover)) {
    this.domNode.style.display = 'none';
    this.domNode.style.zIndex = 0;
    this.controller.setExpanded(false);
  }
};

/*
*   This content is licensed according to the W3C Software License at
*   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
*
*   Simple accordion pattern example
*/

'use strict';

Array.prototype.slice.call(document.querySelectorAll('.Accordion')).forEach(function (accordion) {

  // Allow for multiple accordion sections to be expanded at the same time
  var allowMultiple = accordion.hasAttribute('data-allow-multiple');
  // Allow for each toggle to both open and close individually
  var allowToggle = (allowMultiple) ? allowMultiple : accordion.hasAttribute('data-allow-toggle');

  // Create the array of toggle elements for the accordion group
  var triggers = Array.prototype.slice.call(accordion.querySelectorAll('.Accordion-trigger'));
  var panels = Array.prototype.slice.call(accordion.querySelectorAll('.Accordion-panel'));


  accordion.addEventListener('click', function (event) {
    var target = event.target;

    if (target.classList.contains('Accordion-trigger')) {
      // Check if the current toggle is expanded.
      var isExpanded = target.getAttribute('aria-expanded') == 'true';
      var active = accordion.querySelector('[aria-expanded="true"]');

      // without allowMultiple, close the open accordion
      if (!allowMultiple && active && active !== target) {
        // Set the expanded state on the triggering element
        active.setAttribute('aria-expanded', 'false');
        // Hide the accordion sections, using aria-controls to specify the desired section
        document.getElementById(active.getAttribute('aria-controls')).setAttribute('hidden', '');

        // When toggling is not allowed, clean up disabled state
        if (!allowToggle) {
          active.removeAttribute('aria-disabled');
        }
      }

      if (!isExpanded) {
        // Set the expanded state on the triggering element
        target.setAttribute('aria-expanded', 'true');
        // Hide the accordion sections, using aria-controls to specify the desired section
        document.getElementById(target.getAttribute('aria-controls')).removeAttribute('hidden');

        // If toggling is not allowed, set disabled state on trigger
        if (!allowToggle) {
          target.setAttribute('aria-disabled', 'true');
        }
      }
      else if (allowToggle && isExpanded) {
        // Set the expanded state on the triggering element
        target.setAttribute('aria-expanded', 'false');
        // Hide the accordion sections, using aria-controls to specify the desired section
        document.getElementById(target.getAttribute('aria-controls')).setAttribute('hidden', '');
      }

      event.preventDefault();
    }
  });

  // Bind keyboard behaviors on the main accordion container
  accordion.addEventListener('keydown', function (event) {
    var target = event.target;
    var key = event.which.toString();

    var isExpanded = target.getAttribute('aria-expanded') == 'true';
    var allowToggle = (allowMultiple) ? allowMultiple : accordion.hasAttribute('data-allow-toggle');

    // 33 = Page Up, 34 = Page Down
    var ctrlModifier = (event.ctrlKey && key.match(/33|34/));

    // Is this coming from an accordion header?
    if (target.classList.contains('Accordion-trigger')) {
      // Up/ Down arrow and Control + Page Up/ Page Down keyboard operations
      // 38 = Up, 40 = Down
      if (key.match(/38|40/) || ctrlModifier) {
        var index = triggers.indexOf(target);
        var direction = (key.match(/34|40/)) ? 1 : -1;
        var length = triggers.length;
        var newIndex = (index + length + direction) % length;

        triggers[newIndex].focus();

        event.preventDefault();
      }
      else if (key.match(/35|36/)) {
        // 35 = End, 36 = Home keyboard operations
        switch (key) {
          // Go to first accordion
          case '36':
            triggers[0].focus();
            break;
            // Go to last accordion
          case '35':
            triggers[triggers.length - 1].focus();
            break;
        }
        event.preventDefault();

      }

    }
  });

  // These are used to style the accordion when one of the buttons has focus
  accordion.querySelectorAll('.Accordion-trigger').forEach(function (trigger) {

    trigger.addEventListener('focus', function (event) {
      accordion.classList.add('focus');
    });

    trigger.addEventListener('blur', function (event) {
      accordion.classList.remove('focus');
    });

  });

  // Minor setup: will set disabled state, via aria-disabled, to an
  // expanded/ active accordion which is not allowed to be toggled close
  if (!allowToggle) {
    // Get the first expanded/ active accordion
    var expanded = accordion.querySelector('[aria-expanded="true"]');

    // If an expanded/ active accordion is found, disable
    if (expanded) {
      expanded.setAttribute('aria-disabled', 'true');
    }
  }

});

document.getElementById('alertconfirm')
	.addEventListener('click', function() {
		/* [… code saving data …] */
		alert('Thanks for submitting the form!');
	});

// Select all links with hashes
$('a[href*="#"]')
  // Remove links that don't actually link to anything
  .not('[href="#"]')
  .not('[href="#0"]')
  .click(function(event) {
    // On-page links
    if (
      location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '')
      &&
      location.hostname == this.hostname
    ) {
      // Figure out element to scroll to
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      // Does a scroll target exist?
      if (target.length) {
        // Only prevent default if animation is actually gonna happen
        event.preventDefault();
        $('html, body').animate({
          scrollTop: target.offset().top
        }, 1000, function() {
          // Callback after animation
          // Must change focus!
          var $target = $(target);
          $target.focus();
          if ($target.is(":focus")) { // Checking if the target was focused
            return false;
          } else {
            $target.attr('tabindex','-1'); // Adding tabindex for elements not focusable
            $target.focus(); // Set focus again
          };
        });
      }
    }
  });
