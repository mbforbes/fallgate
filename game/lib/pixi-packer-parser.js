//
// Below from resource-loader (so we don't need some kind of pre-building to
// support require(...)):
// https://github.com/englercj/resource-loader/blob/master/src/Resource.js
//

let Resource = {};

/**
 * The types of resources a resource could represent.
 *
 * @static
 * @readonly
 * @enum {number}
 */
Resource.TYPE = {
    UNKNOWN: 0,
    JSON: 1,
    XML: 2,
    IMAGE: 3,
    AUDIO: 4,
    VIDEO: 5,
    TEXT: 6,
};

/**
 * The types of loading a resource can use.
 *
 * @static
 * @readonly
 * @enum {number}
 */
Resource.LOAD_TYPE = {
    /** Uses XMLHttpRequest to load the resource. */
    XHR: 1,
    /** Uses an `Image` object to load the resource. */
    IMAGE: 2,
    /** Uses an `Audio` object to load the resource. */
    AUDIO: 3,
    /** Uses a `Video` object to load the resource. */
    VIDEO: 4,
};

//
// Below is the pixi-packer-parser source, modified to just export a function
// nameed pixiPackerParser.
//

// NOTE Removing these.
// "use strict";
// var Resource = require("resource-loader").Resource;


function pathWithoutFile(path) {
    var elements = path.split("/");
    elements.pop(); // remove filename
    return elements.join("/");
}

// Simple "wait for all" helper class
function WaitForAll(count, allDone) {
    var remaining = count;

    this.done = function () {
        remaining--;
        if (remaining === 0) {
            allDone();
        }
    };
}

let pixiPackerParser = function (PIXI) {
    return function (resource, next) {
        // skip if no data, its not json, or it isn't a pixi-packer manifest
        if (!resource.data || resource.type !== Resource.TYPE.JSON || !resource.data.meta || resource.data.meta.type !== "pixi-packer") {
            return next();
        }

        if (resource.data.meta.version > 1) {
            throw new Error("pixi-packer manifest version " + resource.data.meta.version + " not supported");
        }

        var loader = this;

        var loadOptions = {
            crossOrigin: resource.crossOrigin,
            loadType: Resource.LOAD_TYPE.IMAGE,
            parentResource: resource
        };

        var urlForManifest = resource.url.replace(loader.baseUrl, "");
        var route = pathWithoutFile(urlForManifest);

        var resolution = resource.data.resolution;

        if (resource.data.spritesheets.length && loader.progress === 100) {
            // This is a temporary workaround until a solution for https://github.com/englercj/resource-loader/pull/32 is found
            loader.progress = 0;
        }

        // Load all spritesheets
        var waiter = new WaitForAll(resource.data.spritesheets.length, next);
        resource.data.spritesheets.forEach(function (spritesheet) {
            var name = spritesheet.image;
            var imageUrl = route + "/" + spritesheet.image;
            if (PIXI.Texture.removeFromCache) {
                PIXI.Texture.removeFromCache(name);
                PIXI.Texture.removeFromCache(imageUrl);
                PIXI.BaseTexture.removeFromCache(name);
                PIXI.BaseTexture.removeFromCache(imageUrl);
            }
            loader.add(name, imageUrl, loadOptions, function (res) {
                res.texture.baseTexture.resolution = resolution;
                res.texture.baseTexture.update();
                res.textures = {};
                spritesheet.sprites.forEach(function (sprite) {
                    var frame = new PIXI.Rectangle(
                        sprite.position.x / resolution,
                        sprite.position.y / resolution,
                        sprite.dimension.w / resolution,
                        sprite.dimension.h / resolution
                    );

                    var crop;
                    if (Number(PIXI.VERSION.charAt(0)) >= 4) {
                        crop = new PIXI.Rectangle(
                            0,
                            0,
                            sprite.dimension.w / resolution,
                            sprite.dimension.h / resolution
                        );
                    } else {
                        crop = frame.clone();
                    }

                    var trim = null;

                    //  Check to see if the sprite is trimmed
                    if (sprite.trim) {
                        if (Number(PIXI.VERSION.charAt(0)) >= 4) {
                            trim = new PIXI.Rectangle(
                                sprite.trim.x / resolution,
                                sprite.trim.y / resolution,
                                sprite.trim.w / resolution,
                                sprite.trim.h / resolution
                            );

                            frame.width = sprite.trim.w / resolution;
                            frame.height = sprite.trim.h / resolution;
                        } else {
                            trim = new PIXI.Rectangle(
                                sprite.trim.x / resolution,
                                sprite.trim.y / resolution,
                                frame.width,
                                frame.height
                            );

                            crop.width = sprite.trim.w / resolution;
                            crop.height = sprite.trim.h / resolution;
                        }
                    }

                    res.textures[sprite.name] = new PIXI.Texture(res.texture.baseTexture, frame, crop, trim, false);

                    // lets also add the frame to pixi's global cache for fromFrame and fromImage functions
                    PIXI.utils.TextureCache[sprite.name] = res.textures[sprite.name];
                });
                waiter.done();
            });
        });
    };
};
