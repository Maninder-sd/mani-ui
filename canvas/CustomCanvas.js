/**
 * Author: mdhanauta@fgfbrands.com
 * Created: 2026-01-18
 * Description: 
 */



// BUGS: 
// doesn;t work well if there is scrolling bars

const UNIT = 2; // 2% of canvas, controls how fine the layout can be


// grabs the template from videowall.html
// this makes writing the html template easier 
//const res = await fetch('/html/CustomCanvas.html');
const base = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;
const res = await fetch(`${base}/mani-ui/canvas/CustomCanvas.html`);

const htmlString = await res.text();
const parser = new DOMParser();
var FILETEMPLATE = parser.parseFromString(htmlString, 'text/html').documentElement; // this is an HTMLElement
// NOTE: Try using .cloneNode(true) any time you use an element from this template

const mathUtil = {

    relCoord: function (mouse, parentDim) {
        // mouse coordinates and html element

        let el_x = parentDim.left;
        let el_y = parentDim.top;
        let el_width = parentDim.width;
        let el_height = parentDim.height;

        const relCoord = {
            x: this.round(this.between(mouse.x - el_x, 0, el_width) / el_width * 100, UNIT),
            y: this.round(this.between(mouse.y - el_y, 0, el_height) / el_height * 100, UNIT)
        }
        // console.log(`relCoord ${relCoord.x}, ${relCoord.y}`)
        return relCoord
        // return 


    },

    absCoord: function (point, parentDim) {

        let el_width = parentDim.width;
        let el_height = parentDim.height;
        // console.log(parentDim)
        const absCoord = {
            x: el_width * point.x / 100,
            y: el_height * point.y / 100,
        }
        // console.log(`absCoord ${absCoord.x}, ${absCoord.y}`)
        return absCoord
        // return {
        //     x: el_width * point.x / 100,
        //     y: el_height * point.y / 100,
        // }
    },

    between(val, lower, upper) {
        if (val < lower) { return lower }
        if (val > upper) { return upper }
        return val
    },
    round(value, interval) {
        return Math.round(value / interval) * interval;
    },
    hasOverlapListObject(coordList, object) {
        // O(n)
        let n = coordList.length
        for (let i = 0; i < n; i++) {
            if (coordList[i] !== object) {
                if (this.hasOverlap(coordList[i], object)) {
                    return true;
                }
            }
        }
        return false;
    },
    hasOverlap(coord1, coord2) {
        if (coord1.x_right <= coord2.x_left || coord2.x_right <= coord1.x_left) {
            return false;
        }
        if (coord1.y_top >= coord2.y_bottom || coord2.y_top >= coord1.y_bottom) {
            // y coord increases going down
            return false;
        }
        return true;
    }
}


class Card {
    constructor(cardId, layoutId, templateId, canvasDim) {


        this.canvasDim = canvasDim;// Card responsible for abs to relative
        this.layoutId = layoutId;
        this.cardId = cardId;
        this.templateId = templateId;

        this.templateCard = {
            cardId: cardId,
            templateId: templateId,
            //min
            x_left: null,
            y_top: null,
            //max
            x_right: null,
            y_bottom: null,
        };


        this.layoutCardDatasource = {}; // details aren't seen by this componenet

        // temporary attributes, not saved into db
        this.planted_x = null;
        this.planted_y = null;

        this.isTemp = true;


        // these coords are always relative


        this.cardContent = null; // this stores HTMLElement for the content
        this.cardMain = FILETEMPLATE.querySelector(".card-main").cloneNode(true);; //HTMLElement responsible for card positioning 

        this.cardMain.id = `Card_${cardId}`;
        console.log("created a new card ", cardId)


    }

    anchorVertex(x, y) {
        // used to initiate editing or new creation of card

        // const relCoord = mathUtil.relCoord({ x: x, y: y }, this.canvasDim)
        // todo 
        // right now works only with relative points
        this.planted_x = x;
        this.planted_y = y;
    }

    setUnanchoredVertex(x, y) {
        // x,y are mouse coord

        const rect = this.canvasDim;
        const absolutePosition = {
            x: rect.x + window.scrollX,      // or window.pageXOffset
            y: rect.y + window.scrollY,      // or window.pageYOffset
            width: rect.width,
            height: rect.height,
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            right: rect.right + window.scrollX,
            bottom: rect.bottom + window.scrollY
        };



        const relCoord = mathUtil.relCoord({ x: x, y: y }, absolutePosition)

        // max
        this.templateCard.x_right = Math.max(this.planted_x, relCoord.x);
        this.templateCard.y_bottom = Math.max(this.planted_y, relCoord.y);

        // min
        this.templateCard.x_left = Math.min(this.planted_x, relCoord.x);
        this.templateCard.y_top = Math.min(this.planted_y, relCoord.y);

        this.setDomVertices();

    }

    // ------------

    dragOffset(dragCenter, dragTo, preDragTemplateCard) {
        //dragCenter, dragTo are abs coordinates
        //preDragTemplateCard contains relative coords

        // note: always work with relative coords, leave abs coords to the dom rendering 

        console.log("dragOffset")

        // todo scrolling
        const relDragCenter = mathUtil.relCoord(dragCenter, this.canvasDim);
        const relDragTo = mathUtil.relCoord(dragTo, this.canvasDim);

        let del_x = relDragTo.x - relDragCenter.x;
        let del_y = relDragTo.y - relDragCenter.y;

        // max
        this.templateCard.x_right = preDragTemplateCard.x_right + del_x;
        this.templateCard.y_bottom = preDragTemplateCard.y_bottom + del_y;

        // min
        this.templateCard.x_left = preDragTemplateCard.x_left + del_x;
        this.templateCard.y_top = preDragTemplateCard.y_top + del_y;

        //bug card will get squashed 

        this.setDomVertices();
        return;






        //console.log(del_x, del_y);


        //const absTopLeft = mathUtil.absCoord({
        //    x: preDragTemplateCard.x_left,
        //    y: preDragTemplateCard.y_top
        //}, this.canvasDim);

        //const absBottomRight = mathUtil.absCoord({
        //    x: preDragTemplateCard.x_right,
        //    y: preDragTemplateCard.y_bottom
        //}, this.canvasDim);

        //absTopLeft.x += del_x;
        //absTopLeft.y += del_y;

        //absBottomRight.x += del_x;
        //absBottomRight.y += del_y;
        //console.log(absTopLeft);





        //const rect = this.canvasDim;
        //const absolutePosition = {
        //    x: rect.x + window.scrollX,      // or window.pageXOffset
        //    y: rect.y + window.scrollY,      // or window.pageYOffset
        //    width: rect.width,
        //    height: rect.height,
        //    top: rect.top + window.scrollY,
        //    left: rect.left + window.scrollX,
        //    right: rect.right + window.scrollX,
        //    bottom: rect.bottom + window.scrollY
        //};

        //const relTopLeft = mathUtil.relCoord(absTopLeft, rect)
        //const relBottomRight = mathUtil.relCoord(absBottomRight, rect)

        //console.log(relTopLeft);
        //console.log(this.templateCard)
        //return;


    }

    // ------------
    setAllVertices(row) {
        // these coords are always relative
        //min
        this.templateCard.x_left = row.x_left;
        this.templateCard.y_top = row.y_top;
        //max
        this.templateCard.x_right = row.x_right;
        this.templateCard.y_bottom = row.y_bottom;

        this.setDomVertices();
    }

    setDomVertices() {
        // getting abs coord for rendering

        const absSizes = mathUtil.absCoord({
            x: this.templateCard.x_right - this.templateCard.x_left,
            y: this.templateCard.y_bottom - this.templateCard.y_top
        }, this.canvasDim)

        const absTopLeft = mathUtil.absCoord({
            x: this.templateCard.x_left,
            y: this.templateCard.y_top
        }, this.canvasDim)

        // updating DOM element
        this.cardMain.style.top = absTopLeft.y + 'px';
        this.cardMain.style.left = absTopLeft.x + 'px';
        this.cardMain.style.width = absSizes.x + 'px';
        this.cardMain.style.height = absSizes.y + 'px';
    }
    // --------------------

    setCardContent(row) {
        // example
        // { cardId: 1, layoutId: 4, createdBy: "User 1", createdDate: "2024-01-01", 
        // cardName: "Card 1", componentType: "Camera", source: "Source 1", scale: 7.8, offsetX: 1.2, offsetY: -6.5 },
        this.layoutCardDatasource = row;
    }

    renderCardContent(createCardContent) {
        // return;
        this.cardContent = createCardContent(this.layoutCardDatasource);
        this.cardMain.querySelector(".card-main-content").innerHTML = ""
        this.cardMain.querySelector(".card-main-content").appendChild(this.cardContent);
    }
    emptyCardContent() {
        return;
        this.cardMain.querySelector(".card-main-content").innerHTML = ""
    }

    toString() {
        return `${this.templateCard.x_left} ${this.templateCard.y_top} ${this.templateCard.x_right} ${this.templateCard.y_bottom}`
    }
}


// Events such as mouse up/down/click and key downs are used for multiple reasons ----------------------------------------------------------------------#
// resulting in race conditions and undesired behaviour

const STATES = {
    FIXED: "FIXED",
    IDLE: "IDLE",

    EDIT_DATASOURCE: "EDIT_DATASOURCE",
    EDIT_DATASOURCE_CARD_SELECTED: "EDIT_DATASOURCE_CARD_SELECTED",

    EDIT_TEMPLATE: "EDIT_TEMPLATE",
    CARD_SELECTED: "CARD_SELECTED",
    EDITTING_CARD: "EDITTING_CARD",
    CARD_DRAGGING: "CARD_DRAGGING",

    CAN_CREATE_CARD: "CAN_CREATE_CARD",
    CREATING: 'CREATING',
    CREATING_CARD: "CREATING_CARD",

}

const EVENTS = {
    EDIT_DATASOURCE: "EDIT_DATASOURCE",
    EDIT_DATASOURCE_CARD_SELECTED: "EDIT_DATASOURCE_CARD_SELECTED",
    SAVE: "SAVE",
    CANCEL: "CANCEL",

}

const eventHandler = function (eventType, e) {
    // "this" refers to the canvas object if called properly
    let state = this.state;
    let stateParams = this.stateParams;

    switch (state) {

        // ======================================= Editing the template ========================================= //
        case STATES.EDIT_TEMPLATE:
            switch (eventType) {
                // "click", "mousedown", "mouseup", "mousemove", "keydown"
                case "click": {
                    let cardEl = e.target.closest(".card-main");
                    if (cardEl) {
                        console.log("selected card " + cardEl.id)
                        cardEl.classList.add("focus", "edit-position")
                        const cardId = (+cardEl.id.split("_")[1]) // to int
                        console.log("the id is " + cardId)
                        this.focusedCard = this.findCard(cardId);
                        this.cardEditted(this.focusedCard); // move to editting, if applicable
                        console.log(this.focusedCard)
                        this.state = STATES.CARD_SELECTED; // goes to card editting code
                        break;

                    }
                    break;
                }
                case "mousedown": {

                    break;
                }
                case "mouseup": {

                    break;
                }
                case "mousemove": {
                    if (stateParams.onCanvas) {
                        this.state = STATES.CAN_CREATE_CARD
                    }
                    break;
                }
                case "keydown": {

                    break;
                }
                default: {

                    break;
                }
            }
            break;

        // ======================================= Card creation logic ========================================= //
        case STATES.CAN_CREATE_CARD:
            switch (eventType) {
                case "click": {
                    //this.mouse.x = e.clientX;
                    //this.mouse.y = e.clientY;

                    this.mouse.x = e.pageX;
                    this.mouse.y = e.pageY;

                    // creates a temp unique id - can optimize
                    var newId = this.getNewId();

                    const rect = this.el.getBoundingClientRect();

                    const absolutePosition = {
                        x: rect.x + window.scrollX,      // or window.pageXOffset
                        y: rect.y + window.scrollY,      // or window.pageYOffset
                        width: rect.width,
                        height: rect.height,
                        top: rect.top + window.scrollY,
                        left: rect.left + window.scrollX,
                        right: rect.right + window.scrollX,
                        bottom: rect.bottom + window.scrollY
                    };




                    this.focusedCard = new Card(newId, this.layoutId, this.templateId, this.el.getBoundingClientRect())
                    this.focusedCard.cardMain.classList.add("focus", "edit-position");
                    const relCoords = mathUtil.relCoord(this.mouse, absolutePosition);
                    this.focusedCard.anchorVertex(relCoords.x, relCoords.y);

                    // add to dom and array
                    this.data.newCards.push(this.focusedCard)
                    this.el.querySelector(".canvas-area").appendChild(this.focusedCard.cardMain); //dom

                    console.log("started")
                    this.state = STATES.CREATING_CARD;
                    break;
                }
                case "mousemove": {
                    if (!stateParams.onCanvas) {
                        this.state = STATES.EDIT_TEMPLATE
                    }
                    break;
                }

                default:
                    break;
            }
            break;
        //------//
        case STATES.CREATING_CARD:
            switch (eventType) {
                // "click", "mousedown", "mouseup", "mousemove", "keydown"
                case "click": {
                    console.log("creating card done");

                    this.focusedCard.setUnanchoredVertex(this.mouse.x, this.mouse.y)

                    const templateCards = this.data.cards.map(c => c.templateCard);
                    const edittedCards = this.data.editedCards.map(c => c.templateCard);
                    const newCards = this.data.newCards.map(c => c.templateCard);
                    const allCards = [...templateCards, ...edittedCards, ...newCards];

                    if (mathUtil.hasOverlapListObject(allCards, this.focusedCard.templateCard)) {
                        console.log("overlapping!!!")
                        this.focusedCard.cardMain.classList.add("error")
                    } else {
                        this.focusedCard.cardMain.classList.remove("error")
                        //this.focusedCard.cardMain.classList.remove("focus", "edit-position")
                        this.focusedCard.isTemp = false;
                        //this.focusedCard = null;
                        this.state = STATES.CARD_SELECTED
                    }

                    break;
                }


                case "mousedown":
                    break;
                case "mouseup":
                    break;
                case "mousemove": {
                    this.focusedCard.setUnanchoredVertex(this.mouse.x, this.mouse.y)


                    const templateCards = this.data.cards.map(c => c.templateCard);
                    const edittedCards = this.data.editedCards.map(c => c.templateCard);
                    const newCards = this.data.newCards.map(c => c.templateCard);
                    const allCards = [...templateCards, ...edittedCards, ...newCards];
                    if (mathUtil.hasOverlapListObject(allCards, this.focusedCard.templateCard)) {
                        console.log("overlapping!!!")
                        this.focusedCard.cardMain.classList.add("error")
                    } else {
                        this.focusedCard.cardMain.classList.remove("error")
                    }

                    break;
                }

                case "keydown":
                    if (e.key === "Escape" && this.focusedCard.isTemp) {
                        console.log("escape")
                        this.deleteCard(this.focusedCard)
                        this.focusedCard = null;
                        this.state = STATES.EDIT_TEMPLATE;
                    }
                    break;
                default:
                    break;
            }
            break;

        // --------------------------------------------

        // ======================================= Template card editting ========================================= //
        case STATES.CARD_SELECTED: {
            switch (eventType) {
                // "click", "mousedown", "mouseup", "mousemove", "keydown"
                case "click": {
                    let el = e.target;
                    if (el.matches(`#Card_${this.focusedCard.cardId} .edit-circle`)) { // is an edit circle of the focused card
                        console.log(el)

                        // we want to plant the vertex opposite of selected vertex
                        console.log(el.classList)
                        const toPlantRel = { x: -1, y: -1 };

                        if (el.classList.contains("top-left")) {
                            toPlantRel.x = this.focusedCard.templateCard.x_right;
                            toPlantRel.y = this.focusedCard.templateCard.y_bottom;
                        } else if (el.classList.contains("top-right")) {
                            toPlantRel.x = this.focusedCard.templateCard.x_left;
                            toPlantRel.y = this.focusedCard.templateCard.y_bottom;
                            // this.focusedCard.anchorVertex(this.focusedCard.templateCard.x_left, this.focusedCard.y_bottom);
                        } else if (el.classList.contains("bottom-left")) {
                            toPlantRel.x = this.focusedCard.templateCard.x_right;
                            toPlantRel.y = this.focusedCard.templateCard.y_top;
                            // this.focusedCard.anchorVertex(this.focusedCard.templateCard.x_right, this.focusedCard.y_top);
                        } else if (el.classList.contains("bottom-right")) {
                            toPlantRel.x = this.focusedCard.templateCard.x_left;
                            toPlantRel.y = this.focusedCard.templateCard.y_top;
                            // this.focusedCard.anchorVertex(this.focusedCard.templateCard.x_left, this.focusedCard.y_top);
                        }

                        const absCoord = mathUtil.absCoord(toPlantRel, this.focusedCard.canvasDim)
                        this.focusedCard.anchorVertex(toPlantRel.x, toPlantRel.y);

                        console.log("started")
                        this.state = STATES.EDITTING_CARD;
                        break;
                    } else if (el.matches(`#Card_${this.focusedCard.cardId} .delete-card i`)) { // 
                        this.deleteCard(this.focusedCard)
                        console.log("deleted card " + this.focusedCard.cardId)
                        this.focusedCard = null;
                        this.state = STATES.EDIT_TEMPLATE;
                        break;
                    }
                    else if (el.closest(".card-main")) {
                        el = el.closest(".card-main")
                        this.focusedCard?.cardMain.classList.remove("focus", "edit-position");
                        this.focusedCard = null;
                        console.log("selected card " + el.id)
                        el.classList.add("focus", "edit-position")

                        const cardId = (+el.id.split("_")[1]) // to int
                        this.focusedCard = this.findCard(cardId);
                        this.cardEditted(this.focusedCard); // move to editting, if applicable
                        this.state = STATES.CARD_SELECTED;
                        break;
                    } else if (el.matches(".canvas-area")) {
                        this.focusedCard?.cardMain.classList.remove("focus", "edit-position");
                        this.focusedCard = null;

                        this.state = STATES.EDIT_TEMPLATE;
                        break;
                    }
                    console.log("nothing")
                    break;
                }
                case "mousedown": {
                    let el = e.target;

                    const card = el.matches(`#Card_${this.focusedCard.cardId}`) || el.matches(`#Card_${this.focusedCard.cardId} .card-main-content`)
                    if (card) {
                        stateParams.dragCenter = { x: e.pageX, y: e.pageY };
                        stateParams.preDragTemplateCard = structuredClone(this.focusedCard.templateCard);
                        this.state = STATES.CARD_DRAGGING;
                    }
                    break;
                }
                case "mouseup": {

                    break;
                }
                case "mousemove": {

                    break;
                }
                case "keydown": {
                    if (e.key === "Escape") {
                        console.log("edit escape")
                        this.focusedCard.cardMain.classList.remove("focus", "edit-position")
                        console.log(this.focusedCard.cardMain)
                        this.focusedCard = null;
                        this.state = STATES.EDIT_TEMPLATE;
                    }
                    break;
                }
                default: {

                    break;
                }
            }


            break;
        }


        //------//
        case STATES.EDITTING_CARD: {
            switch (eventType) {
                // "click", "mousedown", "mouseup", "mousemove", "keydown"
                case "click": {
                    console.log("creating card done");

                    this.focusedCard.setUnanchoredVertex(this.mouse.x, this.mouse.y)

                    const templateCards = this.data.cards.map(c => c.templateCard);
                    const edittedCards = this.data.editedCards.map(c => c.templateCard);
                    const newCards = this.data.newCards.map(c => c.templateCard);
                    const allCards = [...templateCards, ...edittedCards, ...newCards];

                    if (mathUtil.hasOverlapListObject(allCards, this.focusedCard.templateCard)) {
                        console.log("overlapping!!!")
                        this.focusedCard.cardMain.classList.add("error")
                    } else {
                        this.focusedCard.cardMain.classList.remove("error")
                        //this.focusedCard.cardMain.classList.remove("focus", "edit-position")
                        this.focusedCard.isTemp = false;
                        //this.focusedCard = null;
                        this.state = STATES.CARD_SELECTED;
                    }

                    break;
                }


                case "mousedown":
                    break;
                case "mouseup":
                    break;
                case "mousemove": {
                    this.focusedCard.setUnanchoredVertex(this.mouse.x, this.mouse.y)


                    const templateCards = this.data.cards.map(c => c.templateCard);
                    const edittedCards = this.data.editedCards.map(c => c.templateCard);
                    const newCards = this.data.newCards.map(c => c.templateCard);
                    const allCards = [...templateCards, ...edittedCards, ...newCards];
                    if (mathUtil.hasOverlapListObject(allCards, this.focusedCard.templateCard)) {
                        console.log("overlapping!!!")
                        this.focusedCard.cardMain.classList.add("error")
                    } else {
                        this.focusedCard.cardMain.classList.remove("error")
                    }

                    break;
                }

                case "keydown":
                    if (e.key === "Escape" && this.focusedCard.isTemp) {
                        console.log("escape")
                        //this.deleteCard(this.focusedCard)
                        //this.focusedCard = null;
                        //this.state = STATES.EDIT_TEMPLATE;
                    }
                    break;
                default:
                    break;
            }
            break;
        }



        //------//
        case STATES.CARD_DRAGGING: {
            switch (eventType) {
                // "click", "mousedown", "mouseup", "mousemove", "keydown"
                case "click": {


                    break;
                }


                case "mousedown":
                    break;

                case "mouseup":

                    const templateCards = this.data.cards.map(c => c.templateCard);
                    const edittedCards = this.data.editedCards.map(c => c.templateCard);
                    const newCards = this.data.newCards.map(c => c.templateCard);
                    const allCards = [...templateCards, ...edittedCards, ...newCards];

                    if (mathUtil.hasOverlapListObject(allCards, this.focusedCard.templateCard)) {
                        console.log("overlapping!!!")
                        this.focusedCard.cardMain.classList.add("error")
                    } else {
                        this.focusedCard.cardMain.classList.remove("error")
                        //this.focusedCard.cardMain.classList.remove("focus", "edit-position")
                        //this.focusedCard.isTemp = false;
                        //this.focusedCard = null;
                        stateParams.dragCenter = { x: null, y: null };
                        stateParams.preDragTemplateCard = null;
                        this.state = STATES.CARD_SELECTED;

                    }

                    break;


                    break;


                case "mousemove": {
                    //break;
                    //this.focusedCard.setUnanchoredVertex(this.mouse.x, this.mouse.y)



                    //stateParams.dragCenter = { x: e.pageX, y: e.pageY };
                    const dragTo = { x: e.pageX, y: e.pageY };

                    this.focusedCard.dragOffset(stateParams.dragCenter, dragTo, stateParams.preDragTemplateCard);

                    //stateParams.dragCenter = { x: dragTo.x, y: dragTo.y };


                    const templateCards = this.data.cards.map(c => c.templateCard);
                    const edittedCards = this.data.editedCards.map(c => c.templateCard);
                    const newCards = this.data.newCards.map(c => c.templateCard);
                    const allCards = [...templateCards, ...edittedCards, ...newCards];
                    if (mathUtil.hasOverlapListObject(allCards, this.focusedCard.templateCard)) {
                        console.log("overlapping!!!")
                        this.focusedCard.cardMain.classList.add("error")
                    } else {
                        this.focusedCard.cardMain.classList.remove("error")
                    }

                    break;
                }

                case "keydown":
                    if (e.key === "Escape" && this.focusedCard.isTemp) {
                        console.log("escape")
                        //this.deleteCard(this.focusedCard)
                        //this.focusedCard = null;
                        //this.state = STATES.EDIT_TEMPLATE;
                    }
                    break;
                default:
                    break;
            }
            break;
        }






        //---------------//
        // ======================================= Card Data Source Changes ========================================= //
        case STATES.EDIT_DATASOURCE: {
            switch (eventType) {
                // "click", "mousedown", "mouseup", "mousemove", "keydown"
                case "click": {

                    let el = e.target.closest(".card-main");
                    if (el) {
                        this.focusedCard?.cardMain.classList.remove("focus", "edit-position");
                        this.focusedCard = null;
                        console.log("selected card " + el.id)
                        el.classList.add("focus")
                        const cardId = (+el.id.split("_")[1]) // to int
                        this.focusedCard = this.findCard(cardId);
                        this.cardEditted(this.focusedCard); // move to editting, if applicable


                        break;
                    }

                    break;
                }
                case "dblclick": {
                    let el = e.target.closest(".card-main");
                    if (el) {
                        this.focusedCard?.cardMain.classList.remove("focus", "edit-position");
                        this.focusedCard = null;
                        console.log("selected card " + el.id)
                        el.classList.add("focus")
                        const cardId = (+el.id.split("_")[1]) // to int
                        this.focusedCard = this.findCard(cardId);
                        this.cardEditted(this.focusedCard); // move to editting, if applicable
                        this.state = STATES.EDIT_DATASOURCE_CARD_SELECTED;
                        this.el.dispatchEvent(new CustomEvent(EVENTS.EDIT_DATASOURCE_CARD_SELECTED, {
                            detail: {
                                templateId: this.templateId,
                                cardId: this.focusedCard.cardId,
                                layoutId: this.layoutId,
                                layoutCardDatasource: this.focusedCard.layoutCardDatasource
                            }
                        })) // pass in row data for the card 
                        break;
                    }
                }
                case "mousedown": {

                    break;
                }
                case "mouseup": {

                    break;
                }
                case "mousemove": {

                    break;
                }
                case "keydown": {

                    break;
                }
                default: {

                    break;
                }
            }
            break;
        }
        // 
        case STATES.EDIT_DATASOURCE_CARD_SELECTED: {
            switch (eventType) {
                // "click", "mousedown", "mouseup", "mousemove", "keydown"
                case "dblclick": {
                    let el = e.target;
                    if (el.closest(".card-main")) {
                        el = el.closest(".card-main")
                        this.focusedCard?.cardMain.classList.remove("focus", "edit-position");
                        this.focusedCard = null;
                        console.log("selected card " + el.id)
                        el.classList.add("focus")
                        const cardId = (+el.id.split("_")[1]) // to int
                        this.focusedCard = this.findCard(cardId);
                        this.cardEditted(this.focusedCard); // move to editting, if applicable
                        this.state = STATES.EDIT_DATASOURCE_CARD_SELECTED;
                        this.el.dispatchEvent(new CustomEvent(EVENTS.EDIT_DATASOURCE_CARD_SELECTED, {
                            detail: {
                                templateId: this.templateId,
                                cardId: this.focusedCard.cardId,
                                layoutId: this.layoutId,
                                layoutCardDatasource: this.focusedCard.layoutCardDatasource
                            }
                        })) // pass in row data for the card 
                        break;
                    }
                }
                case "click": {

                }
                case "mousedown": {

                    break;
                }
                case "mouseup": {

                    break;
                }
                case "mousemove": {

                    break;
                }
                case "keydown": {

                    break;
                }
                default: {

                    break;
                }
            }
            break;
        }
        //

        // ---------//
        case "template case": {
            switch (eventType) {
                // "click", "mousedown", "mouseup", "mousemove", "keydown"
                case "click": {

                    break;
                }
                case "mousedown": {

                    break;
                }
                case "mouseup": {

                    break;
                }
                case "mousemove": {

                    break;
                }
                case "keydown": {

                    break;
                }
                default: {

                    break;
                }
            }
            break;
        }
        default:
            break;

    }
}

class CustomCanvas {
    constructor(elementId, templateId, layoutId, layoutName) {
        console.log("initializing video wall ", elementId, templateId, layoutId, layoutName);



        // db data
        this.elementId = elementId;
        this.templateId = templateId;
        this.layoutId = layoutId;
        this.layoutName = layoutName;

        // the data needed to render videowall
        this.data = {
            cards: [],
            //these are used during editting
            newCards: [], editedCards: [], deletedCards: []
        }



        this.el = document.getElementById(this.elementId)

        // fix the width and height of this element
        //responsible for making the canvas "dynamic". Resizes to fit screen on load
        // but doesnt resize afterwards

        //$title.css('width', $title.width()+4 + "px");
        this.el.style.width = Math.floor(this.el.offsetWidth / 10) * 10 + "px"; // freezes width in pixels
        this.el.style.height = Math.floor(this.el.offsetHeight / 10) * 10 + "px"; // freezes width in pixels




        // temp data
        this.tempData = { cards: [] }
        this.focusedCard = null
        this.createCardContent = (data) => { return document.createElement("div"); } // function that takes in a row of LayoutCardData and generates html element

        //functions (can be async) that need to be registers - defaults

        // Card CRUDs
        this.deleteTemplateCard = (templateCard) => { console.log(`deleting ${JSON.stringify(templateCard)}`) };
        this.createTemplateCard = (templateCard) => { console.log(`creating ${JSON.stringify(templateCard)}`); return 0; };// returns the id the DB has generated
        this.updateTemplateCard = (templateCard) => { console.log(`update ${JSON.stringify(templateCard)}`) };


        // states, events and event handler ---------------
        this.state = STATES.FIXED;
        this.stateParams = {
            createCard: false,
            creatingCard: false,
            onCanvas: false,
            dragCenter: { x: null, y: null }, // abs coords
        };

        this.eventHandler = eventHandler.bind(this);


        ["dblclick", "click", "mousedown", "mouseup", "mousemove", "keydown"].forEach((element) => {
            document.addEventListener(element, (e) => {
                console.log(this.state)
                this.eventHandler(e.type, e);
            });
        });


        // tracking absolute mouse location
        this.mouse = { x: -1, y: -1 }
        document.addEventListener("mousemove", (e) => {
            //this.mouse.x = e.clientX;
            //this.mouse.y = e.clientY;

            this.mouse.x = e.pageX;
            this.mouse.y = e.pageY;
            // console.log("mouse " + this.mouse.x + ", " + this.mouse.y)

            if (e.target == this.el.querySelector(".canvas-area")) {
                this.stateParams.onCanvas = true;
            } else {
                this.stateParams.onCanvas = false;
            }
        });


        this.loadCanvas()
        this.registerButtonClicks()
        this.createDomApis()
    }

    loadCanvas() {
        // imports the styles from template
        this.el.appendChild(FILETEMPLATE.querySelector("style").cloneNode(true));
        this.el.appendChild(FILETEMPLATE.querySelector(".video-wall-main").cloneNode(true));
    }

    // -----------------------------------------------------DOM APIs----------------------------------------------------- // 
    createDomApis() {
        // any apis that can be accessed through document.queryselector(...).apiName goes here

        //default dom apis 
        this.el.destroy = () => {
            //remove all dom apis and empty the dom element
            const domApis = ["destroy", "getCard", "refreshCard"]
            domApis.forEach(apiName => this.el.removeAttribute(apiName));

            this.el.innerHTML = "";
        };

        this.el.getCard = (cardId) => {
            console.log("getCard " + cardId);
            return this.findCard(cardId);

        };

        this.el.refreshCard = async (cardId) => {
            // re render the card contents of a specific card

            var card = this.findCard(cardId)
            if (!card) {
                console.log("couldn't refresh the card");
                return;
            }

            let el = await this.createCardContent(card.layoutCardDatasource);
            card.cardMain.querySelector(".card-main-content").innerHTML = "";
            card.cardMain.querySelector(".card-main-content").appendChild(el);

        };

        // -----------
        //this.registerOnSave(async function (templateCards, layoutCardData) {
        //    console.log("Default saving")
        //    console.log(templateCards, layoutCardData)
        //});

        // ---------
        //this.el.cardDataSource = (dataSource) => {
        //    // { cardId: 1, layoutId: 4, createdBy: "User 1", createdDate: "2024-01-01", 
        //    // cardName: "Card 1", componentType: "Camera", source: "Source 1", scale: 7.8, offsetX: 1.2, offsetY: -6.5 },

        //    if (this.state !== STATES.EDIT_DATASOURCE_CARD_SELECTED) { return; } // prevent changes based of state

        //    console.log("setting card data for Card_" + dataSource.cardId)
        //    // first clear the canvas all existing card


        //    if (!layoutCardData) {
        //        return;
        //    }
        //    if (layoutCardData && !this.createCardContent) {
        //        throw new Error("cant render the layout without registering createCardContent()");
        //    }
        //    // find and edit existing cards

        //    this.data.cards.forEach(card => {
        //        if (card.cardId === dataSource.cardId) {
        //            card.setCardContent(dataSource);
        //            card.renderCardContent(this.createCardContent)
        //        }
        //    });



        //}
    }

    async loadData(templateCards, layoutCardDatas = []) {
        console.log("loading template data")
        // first clear the canvas all existing card
        this.data.cards = [];
        this.el.querySelector(".canvas-area").innerHTML = "";

        templateCards.forEach(row => {
            //example row
            // { cardId: 1, templateId: 4, x_left: 3, x_right: 47, y_top: 12, y_bottom: 68, createdBy: "User 1", createdDate: "2024-01-01" },
            var card = new Card(row.cardId, this.layoutId, this.templateId, this.el.getBoundingClientRect())
            card.setAllVertices(row);

            this.data.cards.push(card)
            let canvas = this.el.querySelector(".canvas-area");
            canvas.appendChild(card.cardMain)
            //console.log(this.data.cards)

            //            //example row
            // { cardId: 1, layoutId: 4, createdBy: "User 1", createdDate: "2024-01-01", cardName: "Card 1", componentType: "Camera",
            // source: "Source 1", scale: 7.8, offsetX: 1.2, offsetY: -6.5 },
            layoutCardDatas.forEach(layoutCardData => {
                if (layoutCardData.cardId === row.cardId) {
                    card.layoutCardDatasource = layoutCardData;
                }
            })
            //
        });

        // --
        await this.renderCardContent();


    };

    async save() {
        console.log("saving the data");

        let numNew = 0;
        let numEditted = 0;
        let numDeleted = 0;

        //save new cards and update ids


        for (const card of this.data.newCards) {
            console.log("saving new card " + card.cardId);
            let json = this.createTemplateCard(card);

            if (json instanceof Promise) {
                json = await json;
            }
            card.cardId = json.cardId;
            card.cardMain.id = `Card_${json.cardId}`;
            card.templateCard.cardId = json.cardId;
            card.layoutCardDatasource.cardId = json.cardId;
            card.layoutCardDatasource.id = json.dataId;

            console.log("saved new card as" + card.cardId);
            numNew += 1;
        }



        //save editted cards
        for (const card of this.data.editedCards) {
            console.log("saving editted card " + card.cardId);
            let call = this.updateTemplateCard(card);
            if (call instanceof Promise) {
                await call;
            }
            numEditted += 1;
        }




        //save deleted cards
        for (const card of this.data.deletedCards) {
            console.log("saving deleted card " + card.cardId);
            let call = this.deleteTemplateCard(card);
            if (call instanceof Promise) {
                await call;
            }
            numDeleted += 1;
        }



        // prob should put into the loop above
        this.data.cards.push(...this.data.newCards);
        this.data.cards.push(...this.data.editedCards);
        this.data.newCards = [];
        this.data.editedCards = [];
        this.data.deletedCards = [];

        const msg = `Success. Created ${numNew} cards, Edited: ${numEditted} cards, Deleted ${numDeleted} cards`

        this.setToast(msg, "bg-success");

    }

    setToast(msg, color) {
        const toast = document.querySelector("#canvas-toast")
        toast.classList.remove("bg-primary", "bg-success", "bg-danger");
        toast.classList.add(color);
        toast.querySelector(".toast-body").innerText = msg;
        new bootstrap.Toast(toast).show()
        //toast.show();
    }



    // ------------- //

    backupData() {
        // carefully performing a deep copy 
        // https://stackoverflow.com/questions/597588/how-do-you-clone-an-array-of-objects-in-javascript
        // https://stackoverflow.com/questions/72632173/unable-to-use-structuredclone-on-value-of-ref-variable
        this.tempData = { cards: [] }
        this.data.cards.forEach(card => {
            // remove dom data before cloning
            const ogCardMain = card.cardMain;
            const ogCardContent = card.cardContent;
            card.cardMain = null;
            card.cardContent = null


            //cloning
            const cardMain = ogCardMain.cloneNode(true);
            const cardContent = ogCardContent ? ogCardContent.cloneNode(true) : null;
            const cardClone = Object.assign(
                new Card(),
                structuredClone(card)
            );

            //structuredClone(card)
            cardClone.cardMain = cardMain;
            cardClone.cardContent = cardContent;
            this.tempData.cards.push(cardClone)

            // restore original object
            card.cardMain = ogCardMain;
            card.cardContent = ogCardContent;
        })
    }

    restoreBackupData() {
        if (this.tempData === null) { // no backup
            return
        }
        this.el.querySelector(".canvas-area").innerHTML = ""

        this.data.cards = [];
        this.tempData.cards.forEach(card => {
            this.data.cards.push(card);
            let canvas = this.el.querySelector(".canvas-area");
            canvas.appendChild(card.cardMain);
        })

        this.tempData = null;
        this.data.newCards = []
        this.data.editedCards = []
        this.data.deletedCards = [];
    }

    // -----
    deleteCard(card) {

        //checks if in cards
        let index = this.data.cards.indexOf(card)
        if (index !== -1) {
            this.data.cards.splice(index, 1)
            this.data.deletedCards.push(card);
            card.cardMain.remove()
            return;
        }
        //checks if in newCards
        index = this.data.newCards.indexOf(card)
        if (index !== -1) {
            this.data.newCards.splice(index, 1)
            //this.data.deletedCards.push(card);
            card.cardMain.remove()
            return;
        }
        //checks if in edittedCards
        index = this.data.editedCards.indexOf(card)
        if (index !== -1) {
            this.data.editedCards.splice(index, 1)
            this.data.deletedCards.push(card);
            card.cardMain.remove()
            return;
        }
    }

    cardEditted(card) {
        //checks if in the saved cards
        // if new or already editting doesn't matter
        const index = this.data.cards.indexOf(card)
        if (index !== -1) {
            this.data.cards.splice(index, 1)
            this.data.editedCards.push(card);
            return;
        }
    }

    findCard(cardId) {
        // checks cards, new cards and editted card to find a match
        let card = this.data.cards.find(card => card.cardId == cardId);
        if (!card) {
            card = this.data.newCards.find(card => card.cardId == cardId);
        }
        if (!card) {
            card = this.data.editedCards.find(card => card.cardId == cardId);
        }
        return card;
    }


    removeCard(card) {
        const index = this.data.cards.indexOf(card)
        if (index !== -1) {
            this.data.cards.splice(index, 1)
        }
    }
    // --------

    getNewId() {
        let newId = -1;
        if (this.data.cards.length > 0) {
            const maxId = Math.max(
                ...this.data.cards.map(c => Number(c.cardId))
            );
            newId = maxId + 1;
        } else {
            newId = 1;
        }

        if (this.data.newCards.length > 0) {
            const maxId = Math.max(
                ...this.data.newCards.map(c => Number(c.cardId))
            );
            newId = Math.max(maxId + 1, newId);
        }


        return newId;
    };

    // ------------ Render content --------------- //
    removeCardContent() {
        console.log("removing cardContent")
        this.el.querySelectorAll(".card-main-content").forEach(el => {
            el.innerHTML = "";
        })
    }
    async renderCardContent() {
        this.data.cards.forEach(async (card) => {
            let el = await this.createCardContent(card.layoutCardDatasource);
            console.log("in renderCardContent")
            card.cardMain.querySelector(".card-main-content").appendChild(el);
        });
        //
    }

    // ----------- Adding events to button clicks ------------------------- //
    editPermissions(editTemplate, editDatasource) {
        if (!editTemplate) {
            this.el.querySelector("#edit-layout-template").disabled = true;
            this.el.querySelector("#edit-layout-template").style.display = "none";
        }
        if (!editDatasource) {
            this.el.querySelector("#edit-layout-datasources").disabled = true;
            this.el.querySelector("#edit-layout-datasources").style.display = "none";
        }

        if (!editTemplate && !editDatasource) {
            this.el.querySelector("#menu-btn").style.display = "none";
        }
    }
    registerButtonClicks() {
        // edit-layout-template, edit-layout-datasources, canvas-save, canvas-cancel
        this.el.querySelector("#edit-layout-template").addEventListener("click", () => {
            this.removeCardContent();
            this.backupData();

            console.log("edit-layout-template")

            this.el.querySelectorAll("#canvas-save, #canvas-cancel")
                .forEach(el => el.classList.remove("d-none"));
            this.el.querySelector(".canvas-area").classList.add("edit-template")
            this.el.querySelector(".canvas-area").classList.remove("render-canvas")
            bootstrap.Dropdown.getInstance('#menu-btn')?.hide(); // closes the panel
            this.el.querySelector("#menu-btn").disabled = true;
            this.state = STATES.EDIT_TEMPLATE;

            // this.el.querySelectorAll("#canvas-save, #canvas-cancel").classList.remove("d-none");
        });

        // ---
        this.el.querySelector("#edit-layout-datasources").addEventListener("click", () => {
            //this.removeCardContent();
            this.backupData();
            console.log("edit-layout-datasources");
            this.el.querySelectorAll("#canvas-save, #canvas-cancel")
                .forEach(el => el.classList.remove("d-none"));
            this.el.querySelector(".canvas-area").classList.add("edit-datasource")
            this.el.querySelector(".canvas-area").classList.remove("render-canvas")
            bootstrap.Dropdown.getInstance('#menu-btn')?.hide(); // closes the panel
            this.el.querySelector("#menu-btn").disabled = true;
            this.state = STATES.EDIT_DATASOURCE;

            this.el.dispatchEvent(new CustomEvent(EVENTS.EDIT_DATASOURCE, {
                detail: {
                }
            }));


        });

        // ---
        this.el.querySelector("#canvas-save").addEventListener("click", async () => {
            console.log("saving canvas")

            this.el.querySelectorAll("#canvas-save, #canvas-cancel").forEach(el => el.classList.add("d-none"));
            this.el.querySelector(".canvas-area").classList.remove("edit-template")
            this.el.querySelector(".canvas-area").classList.remove("edit-datasource")
            this.el.querySelector(".canvas-area").classList.add("render-canvas")
            this.el.querySelector("#menu-btn").disabled = false;
            this.el.querySelectorAll(".card-main").forEach(el => el.classList.remove("focus"))
            await this.save();
            this.removeCardContent();
            await this.renderCardContent();
            this.state = STATES.FIXED;

            this.el.dispatchEvent(new CustomEvent(EVENTS.SAVE, {
                detail: {
                }
            }));

        });


        // ---
        this.el.querySelector("#canvas-cancel").addEventListener("click", async () => {
            console.log("canvas-cancel")

            this.el.querySelectorAll("#canvas-save, #canvas-cancel").forEach(el => el.classList.add("d-none"));
            this.el.querySelector(".canvas-area").classList.remove("edit-template")
            this.el.querySelector(".canvas-area").classList.remove("edit-datasource")

            this.el.querySelector(".canvas-area").classList.add("render-canvas")
            this.el.querySelector("#menu-btn").disabled = false;
            this.el.querySelectorAll(".card-main").forEach(el => el.classList.remove("focus"))
            this.state = STATES.FIXED;

            // cancel restores previous layout
            this.restoreBackupData();
            this.removeCardContent();
            await this.renderCardContent();

            this.el.dispatchEvent(new CustomEvent(EVENTS.CANCEL, {
                detail: {
                }
            }));


        });
        // --
    }
    // --------

}






export default CustomCanvas