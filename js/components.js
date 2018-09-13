/*
 *
 * js/components.js
 *
 */

export function backgroundText() {
    "use strict";
    
    var wrapper = document.getElementById('bg-repeated');
    let elementToAppend = wrapper.firstElementChild.outerHTML;

    console.log(elementToAppend);

    // allow for repeated background text if only one <h1> element provided
    // otherwise each individal element should be manipulated
    if (wrapper.childElementCount == 1) {
        for (let i = 0; i == 3; i += 1) {
            wrapper.innerHTML(elementToAppend);                 
        }
    }
};

/* s/o https://news.ycombinator.com/hn.js */
