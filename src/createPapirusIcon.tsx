import type { ComponentProps, ComponentType, ReactNode } from "react";
import { createElement } from "react";
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Mask,
  Path,
  Pattern,
  Polygon,
  Polyline,
  RadialGradient,
  Rect,
  Stop,
  Symbol as SvgSymbol,
  Use,
} from "react-native-svg";
import { withUniwind } from "uniwind";

/** `[tag, props, children]`, where `tag` keys into `TAGS`. */
export type PapirusNode = [string, Record<string, string>, PapirusNode[]?];

export type PapirusIconProps = Omit<ComponentProps<typeof Svg>, "className"> & {
  /** Defaults to the icon's native size (24 for symbolic, 64 for colour). */
  size?: number;
  /** Tailwind classes for the `<Svg>` itself, e.g. `opacity-50`. */
  className?: string;
  /** `accent-*` class that fills the `currentColor` of a symbolic icon. */
  colorClassName?: string;
};

const TAGS: Record<string, ComponentType<Record<string, unknown>>> = {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Mask,
  Path,
  Pattern,
  Polygon,
  Polyline,
  RadialGradient,
  Rect,
  Stop,
  Symbol: SvgSymbol,
  Use,
};

const StyledSvg = withUniwind(Svg);

const render = (nodes: PapirusNode[]): ReactNode =>
  nodes.map(([tag, props, children], i) =>
    createElement(TAGS[tag], { key: i, ...props }, children ? render(children) : undefined),
  );

export const createPapirusIcon = (name: string, nativeSize: number, nodes: PapirusNode[]) => {
  const Icon = ({ size = nativeSize, ...rest }: PapirusIconProps) => (
    <StyledSvg viewBox={`0 0 ${nativeSize} ${nativeSize}`} width={size} height={size} {...rest}>
      {render(nodes)}
    </StyledSvg>
  );

  Icon.displayName = name;

  return Icon;
};
