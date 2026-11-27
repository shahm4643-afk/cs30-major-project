# cs30-major-project
I found the actual problems in your latest `sketch.js`. There are two bugs that definitely affect painting, plus one issue with diagonal kerbs. Let's fix them directly.

## **1. Fix Yas Marina editing mode**

This is one of the biggest problems.

In `mousePressed()`, around **line 695**, you currently have:

```
startCircuit(yasMarina, rbFinishLine, sfFinishLine, yasScale);
```

Replace it with:

```
startCircuit(yasMarina, rbFinishLine, sfFinishLine, yasScale, true);
```

Your Monaco button already has `true`. Yas Marina was missing it, so Yas Marina was opening in racing mode instead of editing mode.

## **2. Fix the K key resetting your stripes**

In `keyPressed()`, around **line 747**, find this entire section:

```
if (key === "k" || key === "K") {
  kerbPaintMode = true;
  kerbStripe = 0;
  lastKerbX = -1;
  lastKerbY = -1;
}
```

Replace it with:

```
if ((key === "k" || key === "K") && !kerbPaintMode) {
  kerbPaintMode = true;
  kerbStripe = 0;
  lastKerbX = -1;
  lastKerbY = -1;
}
```

This prevents holding K from repeatedly resetting your red and white pattern.

## **3. Replace your entire&#x20;**`paintKerbCell()`**&#x20;function**

Find your function around **line 491**. Delete the entire existing function and replace it with this:

```

function paintKerbCell() {
  let x = Math.floor((mouseX - circuitOffsetX) / circuitScale / CELL_SIZE);
  let y = Math.floor((mouseY - circuitOffsetY) / circuitScale / CELL_SIZE);

  if (x < 0 || x >= cols || y < 0 || y >= rows) return;

  // Don't repaint the same cell
  if (x === lastKerbX && y === lastKerbY) return;

  // First cell of the stroke
  if (lastKerbX === -1) {
    paintAlternatingKerb(x, y);
  }

  // Connect the previous cell to the current cell
  else {
    let x0 = lastKerbX;
    let y0 = lastKerbY;

    let dx = Math.abs(x - x0);
    let sx = x0 < x ? 1 : -1;

    let dy = -Math.abs(y - y0);
    let sy = y0 < y ? 1 : -1;

    let error = dx + dy;

    while (x0 !== x || y0 !== y) {
      let e2 = 2 * error;

      let oldX = x0;
      let oldY = y0;

      let movedX = false;
      let movedY = false;

      if (e2 >= dy) {
        error += dy;
        x0 += sx;
        movedX = true;
      }

      if (e2 <= dx) {
        error += dx;
        y0 += sy;
        movedY = true;
      }

      // Fill the extra cell on diagonal movements
      if (movedX && movedY) {
        paintAlternatingKerb(x0, oldY);
      }

      paintAlternatingKerb(x0, y0);
    }
  }

  lastKerbX = x;
  lastKerbY = y;
}

```

**Keep your existing&#x20;**`paintAlternatingKerb()`**&#x20;function.** The replacement above uses it to maintain the red-white alternation, including the extra diagonal cells.

## **4. Add&#x20;**`mouseReleased()`

You don't currently have this function.

Add it anywhere outside your other functions. I'd put it immediately after `mouseDragged()` around line 735.

```
function mouseReleased() {
  lastKerbX = -1;
  lastKerbY = -1;
}
```

This makes each new mouse stroke start at a fresh position.

## **5. Update&#x20;**`keyReleased()`

Find your existing function around line 797:

```
function keyReleased() {
  if (key === "f" || key === "F") {
    finishPaintMode = false;
  }
  if (key === "k" || key === "K") {
    kerbPaintMode = false;
  }
}
```

Replace it with:

```
function keyReleased() {
  if (key === "f" || key === "F") {
    finishPaintMode = false;
  }

  if (key === "k" || key === "K") {
    kerbPaintMode = false;
    lastKerbX = -1;
    lastKerbY = -1;
  }
}
```

## **Test it**

**Your expected controls**

Hold **K** + drag

Paint kerbs

Release mouse

End stroke

Release **K**

Exit kerb mode

**Expected pattern**

One important detail: your current `mousePressed()` and `mouseDragged()` already correctly call `paintKerbCell()` when kerb mode is active. **Don't change those functions again.**

Test Yas Marina first, then Monaco. If it still doesn't paint, tell me exactly what happens: no paint at all, only red squares, or gaps in the line. Those are three different problems.