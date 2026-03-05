declare module "spin-wheel" {
  export class Wheel {
    constructor(container: HTMLElement, props?: Record<string, unknown>);
    spinToItem(
      itemIndex?: number,
      duration?: number,
      spinToCenter?: boolean,
      numberOfRevolutions?: number,
      direction?: number,
      easingFunction?: ((n: number) => number) | null
    ): void;
    remove(): void;
  }
  export const easing: {
    cubicOut: (n: number) => number;
    [key: string]: (n: number) => number;
  };
}
