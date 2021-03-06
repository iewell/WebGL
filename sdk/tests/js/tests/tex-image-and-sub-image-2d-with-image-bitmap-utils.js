/*
** Copyright (c) 2016 The Khronos Group Inc.
**
** Permission is hereby granted, free of charge, to any person obtaining a
** copy of this software and/or associated documentation files (the
** "Materials"), to deal in the Materials without restriction, including
** without limitation the rights to use, copy, modify, merge, publish,
** distribute, sublicense, and/or sell copies of the Materials, and to
** permit persons to whom the Materials are furnished to do so, subject to
** the following conditions:
**
** The above copyright notice and this permission notice shall be included
** in all copies or substantial portions of the Materials.
**
** THE MATERIALS ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
** EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
** MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
** IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
** CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
** TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
** MATERIALS OR THE USE OR OTHER DEALINGS IN THE MATERIALS.
*/


function runOneIterationImageBitmapTest(useTexSubImage2D, bindingTarget, program, bitmap, flipY, premultiplyAlpha, optionsVal,
    internalFormat, pixelFormat, pixelType, gl, tiu, wtu)
{
    var halfRed = [128, 0, 0];
    var halfGreen = [0, 128, 0];
    var redColor = [255, 0, 0];
    var greenColor = [0, 255, 0];
    var blackColor = [0, 0, 0];

    switch (gl[pixelFormat]) {
      case gl.RED:
      case gl.RED_INTEGER:
        greenColor = [0, 0, 0];
        break;
      default:
        break;
    }

    debug('Testing ' + (useTexSubImage2D ? 'texSubImage2D' : 'texImage2D') +
          ' with flipY=' + flipY + ' and premultiplyAlpha=' + premultiplyAlpha +
          ', bindingTarget=' + (bindingTarget == gl.TEXTURE_2D ? 'TEXTURE_2D' : 'TEXTURE_CUBE_MAP'));
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Enable writes to the RGBA channels
    gl.colorMask(1, 1, 1, 0);
    var texture = gl.createTexture();
    // Bind the texture to texture unit 0
    gl.bindTexture(bindingTarget, texture);
    // Set up texture parameters
    gl.texParameteri(bindingTarget, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(bindingTarget, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(bindingTarget, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(bindingTarget, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    var targets = [gl.TEXTURE_2D];
    if (bindingTarget == gl.TEXTURE_CUBE_MAP) {
        targets = [gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                   gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                   gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                   gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                   gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                   gl.TEXTURE_CUBE_MAP_NEGATIVE_Z];
    }
    // Upload the image into the texture
    for (var tt = 0; tt < targets.length; ++tt) {
        if (useTexSubImage2D) {
            // Initialize the texture to black first
            gl.texImage2D(targets[tt], 0, gl[internalFormat], bitmap.width, bitmap.height, 0,
                          gl[pixelFormat], gl[pixelType], null);
            gl.texSubImage2D(targets[tt], 0, 0, 0, gl[pixelFormat], gl[pixelType], bitmap);
        } else {
            gl.texImage2D(targets[tt], 0, gl[internalFormat], gl[pixelFormat], gl[pixelType], bitmap);
        }
    }

    var width = gl.canvas.width;
    var halfWidth = Math.floor(width / 2);
    var quaterWidth = Math.floor(halfWidth / 2);
    var height = gl.canvas.height;
    var halfHeight = Math.floor(height / 2);
    var quaterHeight = Math.floor(halfHeight / 2);

    var top = flipY ? quaterHeight : (height - halfHeight + quaterHeight);
    var bottom = flipY ? (height - halfHeight + quaterHeight) : quaterHeight;

    var tl = redColor;
    var tr = premultiplyAlpha ? ((optionsVal.alpha == 0.5) ? halfRed : (optionsVal.alpha == 1) ? redColor : blackColor) : redColor;
    var bl = greenColor;
    var br = premultiplyAlpha ? ((optionsVal.alpha == 0.5) ? halfGreen : (optionsVal.alpha == 1) ? greenColor : blackColor) : greenColor;

    var loc;
    if (bindingTarget == gl.TEXTURE_CUBE_MAP) {
        loc = gl.getUniformLocation(program, "face");
    }

    var tolerance = 10;
    for (var tt = 0; tt < targets.length; ++tt) {
        if (bindingTarget == gl.TEXTURE_CUBE_MAP) {
            gl.uniform1i(loc, targets[tt]);
        }
        // Draw the triangles
        wtu.clearAndDrawUnitQuad(gl, [0, 0, 0, 255]);

        // Check the top pixel and bottom pixel and make sure they have
        // the right color.
        debug("Checking " + (flipY ? "top" : "bottom"));
        wtu.checkCanvasRect(gl, quaterWidth, bottom, 2, 2, tl, "shouldBe " + tl);
        wtu.checkCanvasRect(gl, halfWidth + quaterWidth, bottom, 2, 2, tr, "shouldBe " + tr, tolerance);
        debug("Checking " + (flipY ? "bottom" : "top"));
        wtu.checkCanvasRect(gl, quaterWidth, top, 2, 2, bl, "shouldBe " + bl);
        wtu.checkCanvasRect(gl, halfWidth + quaterWidth, top, 2, 2, br, "shouldBe " + br, tolerance);
    }
}

function runTestOnBindingTargetImageBitmap(bindingTarget, program, bitmaps, optionsVal,
    internalFormat, pixelFormat, pixelType, gl, tiu, wtu)
{
    var cases = [
        { sub: false, bitmap: bitmaps.noFlipYPremul, flipY: false, premultiply: true },
        { sub: true, bitmap: bitmaps.noFlipYPremul, flipY: false, premultiply: true },
        { sub: false, bitmap: bitmaps.noFlipYUnpremul, flipY: false, premultiply: false },
        { sub: true, bitmap: bitmaps.noFlipYUnpremul, flipY: false, premultiply: false },
        { sub: false, bitmap: bitmaps.flipYPremul, flipY: true, premultiply: true },
        { sub: true, bitmap: bitmaps.flipYPremul, flipY: true, premultiply: true },
        { sub: false, bitmap: bitmaps.flipYUnpremul, flipY: true, premultiply: false },
        { sub: true, bitmap: bitmaps.flipYUnpremul, flipY: true, premultiply: false },
    ];

    for (var i in cases) {
        runOneIterationImageBitmapTest(cases[i].sub, bindingTarget, program, cases[i].bitmap,
            cases[i].flipY, cases[i].premultiply, optionsVal, internalFormat, pixelFormat, pixelType, gl, tiu, wtu);
    }
}

function runImageBitmapTestInternal(bitmaps, alphaVal, internalFormat, pixelFormat, pixelType, gl, tiu, wtu)
{
    var optionsVal = {alpha: alphaVal};
    var program = tiu.setupTexturedQuad(gl, internalFormat);
    runTestOnBindingTargetImageBitmap(gl.TEXTURE_2D, program, bitmaps, optionsVal,
        internalFormat, pixelFormat, pixelType, gl, tiu, wtu);

    // cube map texture must be square
    if (bitmaps.noFlipYPremul.width == bitmaps.noFlipYPremul.height) {
        program = tiu.setupTexturedQuadWithCubeMap(gl, internalFormat);
        runTestOnBindingTargetImageBitmap(gl.TEXTURE_CUBE_MAP, program, bitmaps, optionsVal,
            internalFormat, pixelFormat, pixelType, gl, tiu, wtu);
    }

    wtu.glErrorShouldBe(gl, gl.NO_ERROR, "should be no errors");
}

function runImageBitmapTest(source, alphaVal, internalFormat, pixelFormat, pixelType, gl, tiu, wtu)
{
    var bitmaps = [];
    var p1 = createImageBitmap(source, {imageOrientation: "none", premultiplyAlpha: "premultiply"}).then(function(imageBitmap) { bitmaps.noFlipYPremul = imageBitmap });
    var p2 = createImageBitmap(source, {imageOrientation: "none", premultiplyAlpha: "none"}).then(function(imageBitmap) { bitmaps.noFlipYUnpremul = imageBitmap });
    var p3 = createImageBitmap(source, {imageOrientation: "flipY", premultiplyAlpha: "premultiply"}).then(function(imageBitmap) { bitmaps.flipYPremul = imageBitmap });
    var p4 = createImageBitmap(source, {imageOrientation: "flipY", premultiplyAlpha: "none"}).then(function(imageBitmap) { bitmaps.flipYUnpremul = imageBitmap });
    Promise.all([p1, p2, p3, p4]).then(function() {
        runImageBitmapTestInternal(bitmaps, alphaVal, internalFormat, pixelFormat, pixelType, gl, tiu, wtu);
    }, function() {
        // createImageBitmap with options could be rejected if it is not supported
        finishTest();
        return;
    });
}
