export const findElement = <TElement extends HTMLElement>(
  testId: string,
  type: new () => TElement,
) => {
  const found = document.querySelector(`[data-testid="${testId}"]`);

  if (!(found instanceof type)) {
    throw new Error(`The lab page has no ${testId} element.`);
  }

  return found;
};
