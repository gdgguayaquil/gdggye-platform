import { createThemeCss } from "./createCssVariables";
import type { AppTheme } from "./types";

// Server component. Emits a single <style> tag carrying both light and dark
// themes. Toggling `data-theme="dark"` on <html> swaps the active block
// without re-rendering React.
export function ThemeStyles({
  light,
  dark,
}: {
  light: AppTheme;
  dark: AppTheme;
}) {
  const css = createThemeCss(light, dark);
  return (
    <style
      // CSS is generated from typed theme objects — no untrusted input.
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: css }}
    />
  );
}
