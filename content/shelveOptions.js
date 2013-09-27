/* ***** BEGIN LICENSE BLOCK *****
 *   Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 * 
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Shelve.
 *
 * The Initial Developer of the Original Code is
 * Thomas Link.
 * Portions created by the Initial Developer are Copyright (C) 2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 * 
 * ***** END LICENSE BLOCK ***** */

/*jsl:option explicit*/ 
/*jsl:declare document*/ 
/*jsl:declare window*/ 
/*jsl:import shelveStore.js*/
/*jsl:import shelve.js*/

var shelveOptions = {
    _preferences: null,
    _richlistitemtmpl: null,
    
    onLoad: function() {
        shelveOptions._preferences = window.document.getElementsByTagName('preferences')[0];
        shelveOptions._richlistitemtmpl = window.document.getElementById('shelveListItemTemplate');

        shelveOptions.fillListbox('1');
        shelveUtils.checkMimeItems(document);
        // var view = document.getElementById('bookmarksTree');
        // view.init(null);
        // view.appendController(PlacesController);
    },

    fillListboxCb: function (listbox, shelfId) {
        // Deep copy our template richlistitem
        var richlistitem = shelveOptions._richlistitemtmpl.cloneNode(true);
        richlistitem.setAttribute('id', 'shelveListItem'+shelfId);
        richlistitem.setAttribute('value', shelfId);
        richlistitem.setAttribute('hidden', false);

        // Setup the mapping to the preference backend
        var prefid = 'shelf_enabled'+shelfId;
        var preference = window.document.createElement('preference');
        preference.setAttribute('id', 'shelf_enabled'+shelfId);
        preference.setAttribute('name', 'extensions.shelve.enabled'+shelfId);
        preference.setAttribute('type', 'bool');
        shelveOptions._preferences.appendChild(preference);

        // Setup the enabled checkbox and glue it to the prefs backend
        var activeCBox = richlistitem.getElementsByTagName('checkbox')[0];
        activeCBox.setAttribute('checked', shelveStore.getBool(shelfId, 'enabled'));
        activeCBox.setAttribute('preference', prefid);

        var labelCell = richlistitem.getElementsByClassName('shelveName')[0];
        labelCell.setAttribute('label', shelveStore.getDescription(shelfId));

        listbox.appendChild(richlistitem);
        return true;
    },

    fillListbox: function(shelfId) {
        var listbox = document.getElementById('theShelves');
        shelveUtils.fillListbox(listbox, shelfId, shelveOptions.fillListboxCb);
        shelveOptions.fillAutoShelves();
    },

    fillAutoShelves: function() {
        var menulist = document.getElementById('menuautoshelf');
        menulist.removeAllItems();
        menulist.appendItem('--' , '--', null);
        var max = shelveStore.max();
        var autoshelf = shelve.getAutoshelfPref();
        menulist.selectedIndex = 1;
        for (var shelfId = 1; shelfId <= max; shelfId++) {
            var name = shelveStore.get(shelfId, 'name');
            var item = menulist.appendItem(name , name, null);
            if (autoshelf && name == autoshelf) {
                menulist.selectedItem = item;
            }
        }
    },

    create: function() {
        var listbox = document.getElementById('theShelves');
        if (shelveUtils.createNewShelf(listbox, shelveOptions.fillListboxCb)) {
            shelveOptions.fillAutoShelves();
        }
    },

    clone: function() {
        var listbox = document.getElementById('theShelves');
        if (shelveUtils.cloneSelected(listbox, shelveOptions.fillListboxCb)) {
            shelveOptions.fillAutoShelves();
        }
    },

    edit: function() {
        var listbox = document.getElementById('theShelves');
        var selected = listbox.selectedItem;
        if (selected) {
            var selectedIndex = listbox.selectedIndex;
            var ed_params = {
                inn: {
                    item: selected.value
                },
                out: null
            };
            window.openDialog('chrome://shelve/content/editShelf.xul',
            '', 'chrome, dialog, modal, resizable=yes', ed_params).focus();
            listbox.focus();
            shelveOptions.fillListbox(selected.value);
        }
    },

    remove: function() {
        var listbox = document.getElementById('theShelves');
        var selected = listbox.selectedItem;
        var selectedIndex = listbox.selectedIndex;
        if (selected) {
            var shelfId = selected.value;
            shelveStore.remove(shelfId);
        }
        shelveOptions.fillListbox(selected.value);
        listbox.focus();
    },

    moveUp: function() {
        var listbox = document.getElementById('theShelves');
        var item = listbox.selectedItem;
        if (item) {
            var pred = listbox.getPreviousItem(item, 1);
            if (pred) {
                shelveOptions.swap(item, pred);
                // var thatShelfId = listbox.getIndexOfItem(pred);
                shelveOptions.fillListbox(pred.value);
                listbox.focus();
            }
        }
    },

    moveDown: function() {
        var listbox = document.getElementById('theShelves');
        var item = listbox.selectedItem;
        if (item) {
            var succ = listbox.getNextItem(item, 1);
            if (succ) {
                shelveOptions.swap(item, succ);
                // var thatShelfId = listbox.getIndexOfItem(succ);
                shelveOptions.fillListbox(succ.value);
                listbox.focus();
            }
        }
    },

    swap: function(item, other) {
        var thisShelfId = item.value;
        var thatShelfId = other.value;
        for (var name in shelveStore.fields) {
            var type = shelveStore.getType(thatShelfId, name) || shelveStore.getType(thisShelfId, name);
            var oval = shelveStore.get(thatShelfId, name, null);
            var cval = shelveStore.get(thisShelfId, name, null);
            if (cval) {
                shelveStore.set(thatShelfId, name, type, cval);
            } else {
                shelveStore.clear(thatShelfId, name);
            }
            if (oval) {
                shelveStore.set(thisShelfId, name, type, oval);
            } else {
                shelveStore.clear(thisShelfId, name);
            }
        }
    },

    onDblClick: function() {
        shelveOptions.edit();
    }

};

