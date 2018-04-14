function Image(searchResult) {
    const thatImage = this;
    this.thumb = ko.observable(searchResult.thumb);
    this.large = ko.observable(searchResult.large);
    this.isActive = ko.observable(false);
    this.isLoaded = ko.observable(false);

    this.toggle = function() {
        thatImage.isActive(!thatImage.isActive());
        Canvas.redraw();
    };

    this.load = function() {
        thatImage.isLoaded(true);
        thatImage.isActive(true);
        Canvas.redraw();
    };
}

const Canvas = (function() {
    const that = this;
    const canvasNode = document.querySelector('#canvas');
    const canvasContext = canvasNode.getContext('2d');

    this.redraw = function(images) {
        canvasContext.globalAlpha = 1.0;
        canvasContext.clearRect(0, 0, canvasNode.width, canvasNode.height);

        const activeThumbs = document.querySelectorAll('.thumbnail.large.loaded.active')
        canvasContext.globalAlpha = 1 / activeThumbs.length * 1.2;
        activeThumbs.forEach(function(imageNode) {
            canvasContext.drawImage(
                imageNode,
                0, 0, // top, left
                canvasNode.width,
                canvasNode.height
            );
        });
    };

    this.dataURL = function() {
        // From https://stackoverflow.com/a/35783382
        // Set data URL type to octet-stream, ensures 'download' prompt instead of just viewing the image.
        return canvasNode.toDataURL("image/png").replace("image/png", "image/octet-stream");
    };

    document.addEventListener('resize', function() {
        console.log('redrawing: resize')
        setTimeout(that.redraw, 250);
    });

    return { redraw: redraw, dataURL: dataURL }
})();

function ImageBlend() {
    const that = this;

    /* Color Picker */
    this.colors = ko.observableArray([
        { 'code': "#0000", 'id': null, 'text': 'all colors', 'rainbow': true },
        { 'code': "#ff2000", 'id': "0",  'text': 'red' },
        { 'code': "#a24615", 'id': "1",  'text': 'copper' },
        { 'code': "#ff7c00", 'id': "2",  'text': 'orange' },
        { 'code': "#ffcf00", 'id': "3",  'text': 'candle' },
        { 'code': "#fffa00", 'id': "4",  'text': 'yellow' },
        { 'code': "#90e200", 'id': "5",  'text': 'chartreuse' },
        { 'code': "#00ab00", 'id': "6",  'text': 'green' },
        { 'code': "#00b2d4", 'id': "7",  'text': 'teal' },
        { 'code': "#0062c6", 'id': "8",  'text': 'blue' },
        { 'code': "#8c20ba", 'id': "9",  'text': 'violet' },
        { 'code': "#f52394", 'id': "a",  'text': 'pink' },
        { 'code': "#ff9f9c", 'id': "b",  'text': 'salmon' },
        { 'code': "#ffffff", 'id': "c",  'text': 'white' },
        { 'code': "#7c7c7c", 'id': "d",  'text': 'grey' },
        { 'code': "#000000", 'id': "e",  'text': 'black' },
    ]);
    this.currentColor = ko.observable(this.colors()[0]);

    this.setColor = function(selectedColor) {
        that.resetSearch();
        that.currentColor(selectedColor);
    };

    /* Search; Variables */
    this.searchTags = ko.observable('desert');
    this.searchErrorMessage = ko.observable(false);
    this.isSearchLoading = ko.observable(false);
    this.searchPageNumber = ko.observable(1);

    /* Search; Functions */
    this.resetSearch = function() {
        that.searchPageNumber(1);
        that.images.removeAll();
    };

    this.search = function() {
        that.searchErrorMessage(false);
        that.isSearchLoading(true);
        getJson({
            method: 'search',
            tags: that.searchTags(),
            page: that.searchPageNumber(),
            color_codes: that.currentColor().id
        }).then(function(response) {
            that.isSearchLoading(false);
            console.log('response from search:', response);
            response.forEach(function(image) {
                that.images.splice(0, 0, new Image(image));
            });
        }).catch(function(response) {
            that.isSearchLoading(false);
            if (response.error && response.trace) {
                console.log('Error:', response.error);
                console.log(response.trace)
                that.searchErrorMessage(response.error);
            } else {
                console.log('Error:', response);
                that.searchErrorMessage(response);
            }
            throw err;
        });
    };

    this.searchKeypress = function(context, event) {
        // https://stackoverflow.com/a/25055138
        event.keyCode === 13 && that.search();
        return true;
    };

    this.nextPage = function() {
        that.searchPageNumber(that.searchPageNumber() + 1);
        that.search();
    };

    /* Search Results */
    this.images = ko.observableArray([]);
    this.images.extend({ rateLimit: 100 }); // Delay up to 100ms

    this.removeImage = function(selectedItem) {
        this.images.remove(function(item) {
            return item.thumb() === selectedItem.thumb();
        });
        setTimeout(Canvas.redraw, 200);
    };

    this.selectAll = function() {
        that.images().forEach(function(image) {
            image.isActive(true);
        });
        Canvas.redraw();
    };

    this.selectNone = function() {
        that.images().forEach(function(image) {
            image.isActive(false);
        });
        Canvas.redraw();
    };

    function stripSpace(txt) {
        if (txt && txt.replace) {
            return txt.replace(/\s*/g, '');
        }
        return txt;
    }


    /* Blended Image */
    this.width = ko.observable(800);
    this.height = ko.observable(800);

    this.width.subscribe(function(newValue) {
        console.log('redrawing: height');
        setTimeout(Canvas.redraw, 250);
    });
    this.height.subscribe(function(newValue) {
        console.log('redrawing: height');
        setTimeout(Canvas.redraw, 250);
    });

    this.save = function(context, event) {
        const activeImageCount = that.images().filter(function(image) {
            return image.isActive;
        }).length;

        var imageDataLink = document.createElement('a');
        document.body.appendChild(imageDataLink);

        // File name
        imageDataLink.download = 'imgblend-' +
                         stripSpace(that.searchTags()) +
                         '-(' + stripSpace(that.currentColor().text) + ')' +
                         '-(' + activeImageCount + 'images)' +
                         '.png';

        // From https://stackoverflow.com/a/35783382
        // Set data URL type to octet-stream, ensures 'download' prompt instead of just viewing the image.
        var dataUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        imageDataLink.href = dataUrl;

        // Emulate anchor click
        imageDataLink.click(event);

        document.body.removeChild(imageDataLink);
    };
}

const app = new ImageBlend();
ko.applyBindings(app, document.querySelector('#app'));

function getJson(params) {
    return new Promise(function(resolve, reject) {
        const url = 'cgi-bin/imgblend.py?' + $.param(params)
        const request = new XMLHttpRequest();
        request.addEventListener('error',  function(e) {
            console.log('Error while calling ' + url, e);
            reject('Error while calling ' + url);
        });
        request.addEventListener('load', function(e) {
            try {
                const jsonResult = JSON.parse(request.response);
                if (jsonResult.error && jsonResult.trace) {
                    reject(jsonResult);
                } else {
                    resolve(jsonResult);
                }
            } catch (err) {
                console.log('Error while parsing JSON from ' + url, request.response);
                reject('Failed to parse JSON from ' + url + ' - ' + request.response);
            }
        });
        request.open('GET', url)
        request.send();
   });
}
