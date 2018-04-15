'use strict';
// Your client side JavaScript code goes here.
// This file is included in every page.

/******************** Setup all event listeners *******************/
//Handle the adding of a new list
$(document).on('click','.add-list', function(){
  let newPosition = $("#lists").children().length + 1;
  createList("Change me!", newPosition, ['']);
});

// Add a new card to an existing list
$(document).on('click','.add-card', function(evt){
  let id = $(this).parent('li').data('id');
  addCardToList(id);
});

//Handle the deletion of a list
$(document).on('click','.delete-list', function(){
  let id = $(this).parent().parent('li').data('id');
  deleteList(id)
});

// Delete a card from an existing list
$(document).on('click','.delete-card', function(evt){
  let contentIndex = $(this).parent('li').data('index');
  let id = $(this).parent('li').data('id');
  deleteCardFromList(id, contentIndex);
});

// Update the name of a list after it has been changed
$(document).on('change','.list-name', function(evt){
  let newName = evt.target.value;
  let id = $(this).parent('li').data('id');
  updateListName(id, newName);
});
$(document).on('change','.edit-contents', function(evt){
  let newContents = evt.target.value;  
  let contentIndex = $(this).parent('li').data('index');
  let id = $(this).parent('li').data('id');  
  updateCardContents(id, newContents, contentIndex);
});
// Highlight title/card contents on click - Better UX
$(document).on('click','.list-name', function(){
  this.setSelectionRange(0, this.value.length);
});
$(document).on('click','.edit-contents', function(){
  this.setSelectionRange(0, this.value.length);
});

// Continually check for resize of textarea when typing
$(document).on('keyup','.edit-contents', function(){
  autoresize(this);
});


/***************************************************************/


// Example code for creating a list on the server
function createList(name, pos, cards) {
  return $.ajax('/api/lists', {
    type: 'POST',
    data: {
      name: name,
      pos: pos,
      cards: cards
    }
  })
  .then(() => loadLists())
  .then((data) => displayLists(data));
}

// Example code for getting all `list`s from server
function loadLists() {
  return $.ajax('/api/lists');
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
  .then(() => loadLists())
  .then((data) => displayLists(data));
}

function deleteList(id) {
  return $.ajax(`/api/lists/${id}`, {
    type: 'DELETE',
  })
  .then(() => loadLists())
  .then((data) => displayLists(data));
}

//Delete a list with the given id
function addCardToList(id) {
  getList(parseInt(id))
    .then(list => {
      let newCards = list.cards !== undefined ? list.cards : []; // Handle an empty list
      newCards.push(``);
      updateList(id, list.name, list.pos, newCards);
    })
    
}

//Move a card from one list to another - called by SortableJS onAdd method
function moveCardToList(newId, newIndex, oldId, oldIndex, contents) {
  deleteCardFromList(oldId, oldIndex);
  getList(parseInt(newId))
    .then(list => {
      let newCards = list.cards !== undefined ? list.cards : [];
      newCards.splice(newIndex,0,contents);
      updateList(newId, list.name, list.pos, newCards);
    })
  }

// Move a card's position within a list
function moveCardWithinList(id, oldIndex, newIndex) {
  getList(parseInt(id))
    .then(list => {
      let newCards = list.cards !== undefined ? list.cards : [];
      arrayMove(newCards, oldIndex, newIndex);
      updateList(id, list.name, list.pos, newCards)
    })
}

//Utility function to let us shift order of cards within a list
function arrayMove(arr, fromIndex, toIndex) {
  let element = arr[fromIndex];
  arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, element);
}

//Delete a card from the list with the given id at the given index
function deleteCardFromList(id, deleteIndex) {
  getList(parseInt(id))
    .then(list => {
      list.cards.splice(parseInt(deleteIndex),1);
      updateList(id, list.name, list.pos, list.cards);
    })
}


//Update the name of a list
function updateListName(id, newName) {
  getList(parseInt(id))
    .then(list => {
      updateList(id, newName, list.pos, list.cards);
    })
}

//Update the text content of a card
function updateCardContents(id, newContents, cardPos) {
  getList(parseInt(id))
    .then(list => {
      cardPos = parseInt(cardPos);
      list.cards[cardPos] = newContents;
      updateList(id, list.name, list.pos, list.cards);
    })
}

// Update the position of lists after they have been dragged around
function updateListPositions() {
  let currPosition = 1;
  $("#lists").children().each(function() {
    const id = this.dataset.id;
    getList(parseInt(id))
      .then(list => {
        list.pos = currPosition;
        updateList(id, list.name, list.pos, list.cards);
      })
      .then(() => currPosition++) //Need to make sure we increment currPosition only after the list has been updated

  });
}

// Utility function to resize textareas
function autoresize(textarea) {
  textarea.style.height = '0px';     //Reset height, so that it not only grows but also shrinks
  textarea.style.height = (textarea.scrollHeight)  + 'px';    //Set new height
}

// Example code for displaying lists in the browser
function displayLists(lists) {
  // Re-render entire component on insertion of new list
  $('#lists').empty();
  // Lists should be ordered based on their 'pos' field
  lists.rows = _.sortBy(lists.rows, 'pos');
  lists.rows.forEach(function(list) {
    let listHandle = $(`<span class="glyphicon glyphicon-menu-hamburger">`);
    let name = $(`<input placeholder="Insert title here..." class="list-name" contenteditable="true">`).val(list.name);
    let deleteListButton = $(`<span class="delete-list">`).append($(`<i>`).text('✘'));    
    let titleWrapper = $(`<div class="title-wrapper">`).append(listHandle).append(name).append(deleteListButton);    
    let addButton = $(`<a href="#" class="add-card">`).text('Add a card...')
    let curElem = $(`<li class="list" data-id="${list.id}">`).append(titleWrapper)
    let innerUl = $(`<ul class="card-container list-group" data-id="${list.id}">`);
    if (list.cards) {
      let cardIdx = 0;      
      list.cards.forEach(function(card) {
        let handle = $(`<span class="glyphicon glyphicon-menu-hamburger">`)
        let innerContentText = $(`<textarea rows=1 contenteditable="true" placeholder="Add something!" class="edit-contents">`).val(card);
        let deleteCardButton = $(`<span class="delete-card">`).append($(`<i>`).text('x'));
        let cardWrapper = $(`<div class="card-wrapper">`).append(handle).append(innerContentText).append(deleteCardButton);    
        innerUl
          .append($(`<li class="card list-group-item" data-id="${list.id}" data-index="${cardIdx}">`)
          .append(handle)
          .append(innerContentText)
          .append(deleteCardButton));

          
        cardIdx++;
      });

    } else {
      // handle empty lists
      innerUl = $(`<ul class="card-container empty-card list-group" data-id="${list.id}">`);
    }
    curElem.append(innerUl);    
    curElem.append(addButton)

     //Make each list of cards draggable using the SortableJS library
     Sortable.create(innerUl[0], {
      group: '.card-container',
      handle: '.glyphicon-menu-hamburger',
      animation: 150,
      // Element is dropped into the list from another list
      onAdd: function (/**Event*/evt) {
        let cardEl = evt.item;
        let contents = $(cardEl).find('textarea').val();
        let oldListId = evt.from.dataset.id;
        let oldIndex = evt.oldIndex;
        let newListId = $(cardEl).parent('ul').data('id');
        let newIndex = evt.newIndex;
        moveCardToList(newListId, newIndex, oldListId, oldIndex, contents)
      },
      // Element is moved within the same list
      onUpdate: function(evt) {
        let listId = evt.from.dataset.id;
        let oldIndex = evt.oldIndex;
        let newIndex = evt.newIndex;
        moveCardWithinList(listId, oldIndex, newIndex);
      }
    });
    // Make entire lists draggable
    Sortable.create($('#lists')[0], {
      group: '.list',
      handle: '.glyphicon-menu-hamburger',
      animation: 150,
      onUpdate: function (/**Event*/evt) {
        updateListPositions();
      },
    })
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
