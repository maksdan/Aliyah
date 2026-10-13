import { useCallback, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import type { LayoutChangeEvent, TextStyle } from 'react-native';

// Keeps iOS from dropping the last line of a multi-line <Text>.
//
// A paragraph's box can come out a sliver shorter than its lines need, and
// TextKit's "does this line fit" test is strict: rather than absorb the
// shortfall it gives up the last line and runs its words onto the line above,
// past the edge. In English that clips the final word; in Hebrew the overflow
// lands at the right, where the line starts, and reads as squished letters,
// with a blank gap below where the lost line should have been.
//
// Two roundings produce the sliver, and they add up:
//   - Yoga rounds each view's edges to the pixel grid and takes height as their
//     difference, which carries float error far down a long scroll: four 24pt
//     lines of Genesis 21:16's translation came out 95.99988, not 96.
//     Upstream fix: https://github.com/react/yoga/pull/2011, not yet released.
//   - At a larger iOS text size the scaled line height is not a whole number of
//     pixels, and the box is rounded down to the grid: at the largest standard
//     size Genesis 8:17 needs 230.01 for five lines and was given 230.
//
// Neither error reaches a point, so every paragraph gets one spare point under
// its measured height. It is invisible, and it is where the shortfall lands.
const SLACK = 1;

export function useFullTextHeight(text: string): {
  style: TextStyle | undefined;
  onLayout: (e: LayoutChangeEvent) => void;
} {
  // Measured once per text at the current iOS text size, and never again: the
  // floored box rounds to the pixel grid itself, so re-measuring it would look
  // like growth and add another point each pass. A new verse (rows are reused
  // when the day changes) or a new text size starts from the natural height.
  const { fontScale } = useWindowDimensions();
  const key = `${fontScale}|${text}`;
  const [floor, setFloor] = useState<{ key: string; minHeight: number } | null>(null);

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { height } = e.nativeEvent.layout;
      setFloor((prev) => (prev && prev.key === key ? prev : { key, minHeight: height + SLACK }));
    },
    [key],
  );

  const style = floor && floor.key === key ? { minHeight: floor.minHeight } : undefined;
  return { style, onLayout };
}
