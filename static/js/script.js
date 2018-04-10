'use strict';
// Your client side JavaScript code goes here.
// This file is included in every page.

$('.add-list').click(() =>  {
  createList('Hello', 1, ['Card 1',])
    .then(() => loadLists())
    .then((data) => displayLists(data));
});

// Example code for creating a list on the server
function createList(name, pos, cards) {
  return $.ajax('/api/lists', {
    type: 'POST',
    data: {
      name: name,
      pos: pos,
      cards: cards
    }
  });
}

// Example code for getting all `list`s from server
function loadLists() {
  return $.ajax('/api/lists');
}

// Example code for displaying lists in the browser
function displayLists(lists) {
  // Re-render entire component on insertion of new list
  $('#lists').empty();
  // Lists should be ordered based on their 'pos' field
  lists.rows = _.sortBy(lists.rows, 'pos');
  lists.rows.forEach(function(list) {
    console.log(list.name);
    var curElem = $('<li>').text(list.name);
    if (list.cards) {
      var innerUl = $('<ul  contenteditable="true" class="list list-group">');
      list.cards.forEach(function(card) {
        innerUl.append($('<li  contenteditable="true" class="list-group-item">').text(card));
      });
      curElem.append(innerUl);
    }
    $('#lists').append(curElem);
  });
}


loadLists()
  .then(function(data) {
    console.log('Lists', data.rows);
    if (data.rows.length) {
      // If some lists are found display them
      displayLists(data);
    } else {
      // If no lists are found, create sample list
      // and re-display.
      console.log('No lists found, creating one.');
      createList('Hello', 0, ['Card 1', 'Card 2'])
        .then(function(list) {
          console.log('Created list', list);
          return loadLists();
        })
        .then(function(lists) {
          displayLists(lists);
        })
    }

  });
