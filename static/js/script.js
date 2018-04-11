'use strict';
// Your client side JavaScript code goes here.
// This file is included in every page.

//Setup all event listeners
//Handle the adding of a new list
$(document).on('click','.add-list', function(){
  createList('Hello', 1, ['Card 1'])
  .then(() => loadLists())
  .then((data) => displayLists(data));
}) 
// Add a new card to an existing list
$(document).on('click','.add-card', function(evt){
  addCardToList(this.dataset.id);
}) 

// Update the name of a list after it has been changed
$(document).on('change','.list-name', function(evt){
  let newName = evt.target.value;
  let id = this.dataset.id;
  updateListName(id, newName);
}) 
$(document).on('change','.edit-contents', function(evt){
  let newContents = evt.target.value;  
  let contentIndex = evt.target.dataset.index;
  let id = this.dataset.id;  
  updateCardContents(id, newContents, contentIndex);
}) 
// Highlight title/card contents on click - Better UX
$(document).on('click','.list-name', function(){
  this.setSelectionRange(0, this.value.length);
}) 
$(document).on('click','.edit-contents', function(){
  this.setSelectionRange(0, this.value.length);
}) 


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

// Get a list based on its id
function getList(id) {
  return $.ajax(`/api/lists/${id}`, {
    type: 'GET',
  })
}

// Update a list given its id, name, pos, cards
// Currently passing {name, pos, cards} as that is what the /:id POST route is expecting
function updateList(id, name, pos, cards) {
  return $.ajax(`/api/lists/${id}`, {
    type: 'POST',
    data: {
      name,
      pos,
      cards
    }
  })
}

//Add a generic card to the list with the given id
function addCardToList(id) {
  getList(id)
  .then(list => {
    list.cards.push(`Card ${list.cards.length+1}`);
    return updateList(id, list.name, list.pos, list.cards);
  })
  .then(() => loadLists())
  .then((data) => displayLists(data));
}

//Update the name of a list
function updateListName(id, newName) {
  getList(id)
  .then(list => {
    updateList(id, newName, list.pos, list.cards);
  })
}

//Update the name of a list
function updateCardContents(id, newContents, cardPos) {
  getList(id)
  .then(list => {
    list.cards[cardPos] = newContents;
    updateList(id, list.name, list.pos, list.cards);
  })
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
    let name = $(`<input class="list-name" contenteditable="true" data-id="${list.id}">`).val(list.name);
    let addButton = $(`<a href="#" class="add-card" data-id="${list.id}">`).text('Add a card...')
    let curElem = $('<li class="list">').append(name)
    if (list.cards) {
      let innerUl = $('<ul class="card-container list-group">');
      let cardIdx = 0;      
      list.cards.forEach(function(card) {
        let innerContentText = $(`<input class="edit-contents" data-id="${list.id}" data-index=${cardIdx}>`);
        innerContentText.val(card);
        innerUl.append($('<li class="list-group-item" >').append(innerContentText));
        cardIdx++;
      });
      curElem.append(innerUl);
      curElem.append(addButton)
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
