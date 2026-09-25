import { useCallback, useState } from 'react';
import type { LayoutChangeEvent, TextStyle } from 'react-native';

// Keeps iOS from dropping the last line of a multi-line <Text>.
//
// Yoga rounds each view's edges to the pixel grid and takes the height as the
// difference of the two rounded edges. On a 3x screen that difference carries
// float error, so a paragraph far down a long scroll is committed a hair under
// the height it measured: four 24pt lines of Genesis 21:16's translation came
// out 95.99988 tall, not 96. TextKit's "does this line fit" test is strict, so
// rather than absorb the shortfall it gives up the last line and runs its words
// onto the line above, past the edge. In English that clips the final word; in
// Hebrew the overflow lands at the right, where the line starts, and reads as
// squished letters. A blank gap is left where the lost line should have been.
//
// Upstream fix: https://github.com/react/yoga/pull/2011, not yet in a release.
// Until then, a paragraph that comes out a sliver short of a whole point is
// floored at that whole point plus a little, so the error lands in spare space
// instead of in the text. Heights here are whole points (lines × lineHeight),
// so a value just under an integer can only be this rounding error.
const SHORTFALL = 0.01; // a real line is never this close to a whole point
const SLACK = 0.5;

export function useFullTextHeight(text: string): {
  style: TextStyle | undefined;
  onLayout: (e: LayoutChangeEvent) => void;
} {
  // Tied to the text it was measured for: rows are reused when the day changes,
  // and a floor from yesterday's verse must not hold open today's.
  const [floor, setFloor] = useState<{ text: string; minHeight: number } | null>(null);

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { height } = e.nativeEvent.layout;
      const whole = Math.round(height);
      if (height < whole && whole - height < SHORTFALL) {
        setFloor((prev) =>
          prev && prev.text === text && prev.minHeight >= whole + SLACK
            ? prev
            : { text, minHeight: whole + SLACK },
        );
      }
    },
    [text],
  );

  const style = floor && floor.text === text ? { minHeight: floor.minHeight } : undefined;
  return { style, onLayout };
}
