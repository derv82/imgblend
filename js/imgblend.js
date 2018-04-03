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
        canvasContext.globalAlpha = 1 / activeThumbs.length;
        activeThumbs.forEach(imageNode => {
            canvasContext.drawImage(
                imageNode,
                0, 0, // top, left
                canvasNode.width,
                canvasNode.height
            );
        });
    }
    return { redraw }
})();

function ImageBlend() {
    const that = this;

    this.page = ko.observable(1);

    this.images = ko.observableArray([]);
    this.images.extend({ rateLimit: 100 }); // Delay up to 100ms

    this.isSearchLoading = ko.observable(false);

    this.searchTags = ko.observable('desert');
    this.searchErrorMessage = ko.observable(false);

    this.nextPage = function() {
        that.page(that.page() + 1);
        that.search();
    };

    this.resetSearch = function() {
        that.page(1);
        that.images.removeAll();
    };

    this.search = function() {
        that.searchErrorMessage(false);
        that.isSearchLoading(true);
        getJson({
            method: 'search',
            tags: that.searchTags(),
            page: that.page(),
            color_codes: that.currentColorId
        }).then(function(response) {
            that.isSearchLoading(false);
            console.log('response from search:', response);
            response.forEach(image => {
                that.images.push(new Image(image));
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

    this.colors = ko.observableArray([
        { 'code': "#333333", 'id': null, 'text': 'all colors' },
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

    this.currentColorCode = ko.observable('transparent');
    this.currentColorId = ko.observable(null);
    this.setColor = function(selectedColor) {
        that.resetSearch();
        that.currentColorCode(selectedColor.code);
        that.currentColorId(selectedColor.id);
    };
}

const app = new ImageBlend();
ko.applyBindings(app, document.querySelector('#app'));

function getJson(params) {
    return new Promise(function(resolve, reject) {
        const url = 'cgi-bin/imgblend.py?' + $.param(params)
        const request = new XMLHttpRequest();
        request.addEventListener('error',  e => {
            console.log('Error while calling ' + url, e);
            reject('Error while calling ' + url);
        });
        request.addEventListener('load', e => {
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
