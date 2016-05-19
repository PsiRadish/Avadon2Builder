/*var IDs =
[
    // "aladin",
    // "berkshire-swash",
    // "caveat-brush",
    // "eagle-lake",
    "fondamento",
    // "julee",
    // "kaushan-script",
    // "merienda-one",
    // "merienda-400",
    // "merienda-700",
    "quintessential",
    // "rancho",
    // "redressed"
];*/

// canvas outline
function computedStyle(element, property)
{
    return window.getComputedStyle(element, null).getPropertyValue(property);
}

// (function()
document.addEventListener('DOMContentLoaded', function()
{
    // // var canvas = document.getElementById('myCanvas');
    // var canvasNumbers = Array.from(document.querySelectorAll('canvas.level-num'));
    // console.log("canvasNumbers", canvasNumbers);
    // 
    // /*var sizer = document.createElement('span');
    // sizer.textContent = canvas.textContent;
    // canvas.parentNode.insertBefore(sizer, canvas.nextSibling);
    // 
    // canvas.width = sizer.offsetWidth;
    // canvas.height = sizer.offsetHeight;
    // 
    // sizer.parentNode.removeChild(sizer);*/
    // 
    // canvasNumbers.forEach(function(canvas)
    // {
    //     // console.log("canvas.offsetHeight", canvas.offsetHeight);
    //     // console.log(canvas);
    //     
    //     canvas.height = canvas.offsetHeight;
    //     canvas.width = canvas.offsetWidth;
    //     // canvas.setAttribute("height", '' + canvas.offsetHeight);
    //     // canvas.setAttribute("width", '' + canvas.offsetWidth);
    //     
    //     // console.log(canvas);
    //     var fontSize = computedStyle(canvas, "font-size");
    //     
    //     var context = canvas.getContext('2d');
    //     var x = 0;
    //     // var y = canvas.height;
    //     var y = 15;
    //     
    //     
    //     // console.log("font-family", computedStyle(canvas, "font-family"));
    //     
    //     // context.font = '60pt Calibri';
    //     context.font = fontSize + ' ' + computedStyle(canvas, "font-family");
    //     context.lineWidth = 2;
    //     
    //     // console.log(computedStyle(canvas, "font-size"));
    //     
    //     // stroke
    //     context.strokeStyle = 'black';
    //     context.strokeText(canvas.textContent, x, y);
    //     
    //     // fill
    //     context.fillStyle = '#FFDEDE';
    //     context.fillText(canvas.textContent, x, y);
    // });
    
    var svgNumbers = Array.from(document.querySelectorAll('svg.level-num'));
    
    svgNumbers.forEach(function(svg)
    {
        var textContent = svg.textContent;
        svg.textContent = ""; // clear invalid markup
        
        var fillText = document.createElementNS("http://www.w3.org/2000/svg", 'text');
        fillText.setAttribute("y", computedStyle(svg, "font-size"));
        fillText.setAttribute("x", "0");
        fillText.textContent = textContent;
        
        var strokeText = fillText.cloneNode(true);
        strokeText.style.stroke = "black";
        strokeText.style.strokeWidth = "2px";
        
        svg.appendChild(strokeText);
        svg.appendChild(fillText);
    });
    
}, false);
// })();
