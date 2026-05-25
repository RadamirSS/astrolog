function delay(ms = 400): Promise<void> {
  const jitter = Math.floor(Math.random() * 400);
  return new Promise((resolve) => setTimeout(resolve, ms + jitter));
}

export { delay };
