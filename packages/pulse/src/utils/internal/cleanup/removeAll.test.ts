import { expect, test, vi } from "vitest";

import { removeAll, rollBack } from "src/utils/internal/cleanup/removeAll";

test("every removal runs newest first even when one throws", () => {
  const order: string[] = [];
  const failure = new Error("second");

  expect(() =>
    removeAll([
      () => order.push("first"),
      () => {
        order.push("second");
        throw failure;
      },
      () => order.push("third"),
    ]),
  ).toThrow(failure);
  expect(order).toEqual(["third", "second", "first"]);
});

test("several failures are kept together", () => {
  const first = new Error("first");
  const second = new Error("second");

  expect(() =>
    removeAll([
      () => {
        throw first;
      },
      () => {
        throw second;
      },
    ]),
  ).toThrow(expect.objectContaining({ errors: [second, first] }));
});

test("a rollback removes everything and rethrows the setup error", () => {
  const remove = vi.fn();
  const failure = new Error("setup");

  expect(() => rollBack([remove, remove], failure)).toThrow(failure);
  expect(remove).toHaveBeenCalledTimes(2);
});

test("a failed rollback is kept beside the setup error", () => {
  const failure = new Error("setup");
  const rollbackFailure = new Error("rollback");

  expect(() =>
    rollBack(
      [
        () => {
          throw rollbackFailure;
        },
      ],
      failure,
    ),
  ).toThrow(expect.objectContaining({ errors: [failure, rollbackFailure] }));
});
