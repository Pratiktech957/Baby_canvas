document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");

    // Set Canvas Size
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    let painting = false;
    let brushSize = 5;
    let currentColor = "#000000"; // Default Black
    let currentTool = "brush";
    let startX, startY;
    let drawingShape = null;
    let fillColor = false;

    let paths = [];
    let redoStack = [];
    let tempSnapshot = null; // To store canvas state before drawing shape

    // Start Drawing
    const startDrawing = (e) => {
        painting = true;
        startX = e.offsetX;
        startY = e.offsetY;

        if (drawingShape) {
            // Take a snapshot of the current canvas before drawing the shape
            tempSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } else if (currentTool === "brush" || currentTool === "eraser") {
            ctx.beginPath();
            ctx.moveTo(startX, startY);
        }
    };

    // Draw on Canvas (Real-Time Shape Preview)
    const draw = (e) => {
        if (!painting) return;

        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";

        if (currentTool === "eraser") {
            ctx.strokeStyle = "white";
        } else {
            ctx.strokeStyle = currentColor;
        }

        if (drawingShape) {
            // Restore the snapshot before drawing new preview
            ctx.putImageData(tempSnapshot, 0, 0);
            drawShape(e, true); // Pass true to indicate it's a preview
        } else if (currentTool === "brush" || currentTool === "eraser") {
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
        }
    };

    // Stop Drawing & Save for Undo
    const stopDrawing = (e) => {
        if (!painting) return;
        painting = false;

        if (drawingShape) {
            drawShape(e, false); // Final shape
        }

        // Store canvas state for Undo/Redo
        paths.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        redoStack = [];  // Clear redo stack after new drawing
    };

    // Draw Shapes (Real-Time Preview & Final)
    const drawShape = (e, isPreview) => {
        const currentX = e.offsetX;
        const currentY = e.offsetY;
        const width = currentX - startX;
        const height = currentY - startY;

        if (isPreview && tempSnapshot) {
            ctx.putImageData(tempSnapshot, 0, 0); // Restore previous state
        }

        ctx.beginPath();
        ctx.lineWidth = brushSize;
        ctx.strokeStyle = currentColor;
        ctx.fillStyle = fillColor ? currentColor : "transparent";

        if (drawingShape === "rectangle") {
            ctx.rect(
                Math.min(startX, currentX),  // Fix: Rectangle should drag properly
                Math.min(startY, currentY),
                Math.abs(width),
                Math.abs(height)
            );
            if (fillColor) ctx.fill();
        } else if (drawingShape === "circle") {
            let radius = Math.sqrt(width ** 2 + height ** 2);
            ctx.arc(startX, startY, radius, 0, Math.PI * 2);
            if (fillColor) ctx.fill();
        } else if (drawingShape === "triangle") {
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX + width, startY + height);
            ctx.lineTo(startX - width, startY + height);
            ctx.closePath();
            if (fillColor) ctx.fill();
        } else if (drawingShape === "line") {
            ctx.moveTo(startX, startY);
            ctx.lineTo(e.offsetX, e.offsetY);
        } else if (drawingShape === "ellipse") {
            ctx.ellipse(
                startX + width / 2,
                startY + height / 2,
                Math.abs(width / 2),
                Math.abs(height / 2),
                0,
                0,
                2 * Math.PI
            );
            if (fillColor) ctx.fill();
        }

        ctx.stroke();
    };

    // Undo Last Action
    const undoLast = () => {
        if (paths.length > 1) {
            redoStack.push(paths.pop());
            ctx.putImageData(paths[paths.length - 1], 0, 0);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    // Redo Last Undone Action
    const redoLast = () => {
        if (redoStack.length > 0) {
            let redoImage = redoStack.pop();
            paths.push(redoImage);
            ctx.putImageData(redoImage, 0, 0);
        }
    };

    // Change Brush Size
    document.querySelector(".slider").addEventListener("input", (e) => {
        brushSize = e.target.value;
    });

    // Change Color
    document.querySelectorAll(".color-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            currentColor = getComputedStyle(btn).backgroundColor;
        });
    });

    // Custom Color Picker
    document.getElementById("customColor").addEventListener("input", (e) => {
        currentColor = e.target.value;
    });

    // Select Tool
    document.querySelectorAll("[name='tool']").forEach((tool) => {
        tool.addEventListener("change", (e) => {
            currentTool = e.target.id;
        });
    });

    // Shape Selection (Fix for Multiple Shapes)
    document.querySelectorAll(".sidebar input[type='checkbox']").forEach((checkbox) => {
        checkbox.addEventListener("change", (e) => {
            if (e.target.checked) {
                drawingShape = e.target.id;
            } else {
                drawingShape = null;
            }
        });
    });

    // Fill Color Toggle
    document.getElementById("fillColor").addEventListener("change", (e) => {
        fillColor = e.target.checked;
    });

    // Clear Canvas
    document.getElementById("clearCanvas").addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        paths = [];
        redoStack = [];
    });

    // Save Canvas as Image
    document.getElementById("saveImage").addEventListener("click", () => {
        const link = document.createElement("a");
        link.download = "canvas-drawing.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    });

    // Undo Button
    document.getElementById("undo").addEventListener("click", undoLast);

    // Redo Button
    document.getElementById("redo").addEventListener("click", redoLast);

    // Attach Event Listeners for Drawing
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing);

    // Initialize Canvas State for Undo/Redo
    paths.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
});
