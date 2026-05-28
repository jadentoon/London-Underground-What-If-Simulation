export const NextResponse = {
  json() {
    throw new Error("next/server mock should be overridden in the test");
  },
};
