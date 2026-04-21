class HuffmanNode {
  constructor(value = null, frequency = 0, left = null, right = null) {
    this.value = value;
    this.frequency = frequency;
    this.left = left;
    this.right = right;
  }
}

class MinHeap {
  constructor() {
    this.heap = [];
  }

  size() {
    return this.heap.length;
  }

  push(node) {
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) {
      return null;
    }

    const root = this.heap[0];
    const end = this.heap.pop();

    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.bubbleDown(0);
    }

    return root;
  }

  bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[parentIndex].frequency <= this.heap[index].frequency) {
        break;
      }
      [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
      index = parentIndex;
    }
  }

  bubbleDown(index) {
    const length = this.heap.length;

    while (true) {
      const left = (index * 2) + 1;
      const right = (index * 2) + 2;
      let smallest = index;

      if (left < length && this.heap[left].frequency < this.heap[smallest].frequency) {
        smallest = left;
      }

      if (right < length && this.heap[right].frequency < this.heap[smallest].frequency) {
        smallest = right;
      }

      if (smallest === index) {
        break;
      }

      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }
}

function buildFrequencyMap(dataBytes) {
  const frequencies = new Array(256).fill(0);
  for (let i = 0; i < dataBytes.length; i += 1) {
    frequencies[dataBytes[i]] += 1;
  }
  return frequencies;
}

function buildHuffmanTree(frequencies) {
  const minHeap = new MinHeap();
  const mergeSteps = [];

  for (let value = 0; value < frequencies.length; value += 1) {
    if (frequencies[value] > 0) {
      minHeap.push(new HuffmanNode(value, frequencies[value]));
    }
  }

  if (minHeap.size() === 0) {
    return { root: null, mergeSteps };
  }

  if (minHeap.size() === 1) {
    const single = minHeap.pop();
    const root = new HuffmanNode(null, single.frequency, single, null);
    return { root, mergeSteps };
  }

  while (minHeap.size() > 1) {
    const left = minHeap.pop();
    const right = minHeap.pop();
    const merged = new HuffmanNode(null, left.frequency + right.frequency, left, right);

    mergeSteps.push({
      leftValue: left.value,
      leftFrequency: left.frequency,
      rightValue: right.value,
      rightFrequency: right.frequency,
      mergedFrequency: merged.frequency
    });

    minHeap.push(merged);
  }

  return { root: minHeap.pop(), mergeSteps };
}

function generateCodes(root) {
  const codes = new Array(256).fill("");

  if (!root) {
    return codes;
  }

  function dfs(node, codePath) {
    if (!node.left && !node.right) {
      codes[node.value] = codePath || "0";
      return;
    }

    if (node.left) {
      dfs(node.left, `${codePath}0`);
    }

    if (node.right) {
      dfs(node.right, `${codePath}1`);
    }
  }

  dfs(root, "");
  return codes;
}

function encodeData(dataBytes, codes) {
  let bitLength = 0;
  for (let i = 0; i < dataBytes.length; i += 1) {
    bitLength += codes[dataBytes[i]].length;
  }

  const encoded = Buffer.alloc(Math.ceil(bitLength / 8));
  let byteIndex = 0;
  let bitOffset = 0;

  for (let i = 0; i < dataBytes.length; i += 1) {
    const code = codes[dataBytes[i]];
    for (let j = 0; j < code.length; j += 1) {
      if (code[j] === "1") {
        encoded[byteIndex] |= (1 << (7 - bitOffset));
      }

      bitOffset += 1;
      if (bitOffset === 8) {
        bitOffset = 0;
        byteIndex += 1;
      }
    }
  }

  const padding = (8 - (bitLength % 8)) % 8;
  return { encoded, padding, bitLength };
}

function decodeData(encodedBuffer, bitLength, root, expectedSymbols) {
  if (!root) {
    return Buffer.alloc(0);
  }

  const decoded = Buffer.alloc(expectedSymbols);

  if (!root.left && !root.right && root.value !== null) {
    decoded.fill(root.value);
    return decoded;
  }

  let outputIndex = 0;
  let node = root;
  let consumedBits = 0;

  while (consumedBits < bitLength && outputIndex < expectedSymbols) {
    const byteIndex = consumedBits >> 3;
    const bitIndex = consumedBits & 7;
    const bit = (encodedBuffer[byteIndex] >> (7 - bitIndex)) & 1;
    node = bit === 0 ? node.left : node.right;

    if (!node.left && !node.right) {
      decoded[outputIndex] = node.value;
      outputIndex += 1;
      node = root;

      if (outputIndex >= expectedSymbols) {
        return decoded;
      }
    }

    consumedBits += 1;
  }

  return decoded;
}

function getCodeLengthDistribution(codes, frequencies) {
  const distribution = new Map();

  for (let value = 0; value < 256; value += 1) {
    const frequency = frequencies[value] || 0;
    if (frequency === 0) {
      continue;
    }

    const bitLength = codes[value].length;
    const current = distribution.get(bitLength) || 0;
    distribution.set(bitLength, current + frequency);
  }

  return [...distribution.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bitLength, count]) => ({ bitLength, count }));
}

function computeEncodedBitStats(codes, frequencies, symbolCount) {
  let encodedBitSize = 0;

  for (let value = 0; value < 256; value += 1) {
    const frequency = frequencies[value] || 0;
    if (frequency > 0) {
      encodedBitSize += frequency * codes[value].length;
    }
  }

  const averageBitsPerSymbol = symbolCount > 0 ? encodedBitSize / symbolCount : 0;

  return {
    encodedBitSize,
    averageBitsPerSymbol
  };
}

function serializeTree(node) {
  if (!node) {
    return null;
  }

  if (!node.left && !node.right) {
    return { value: node.value, frequency: node.frequency };
  }

  return {
    value: null,
    frequency: node.frequency,
    left: serializeTree(node.left),
    right: serializeTree(node.right)
  };
}

export {
  buildFrequencyMap,
  buildHuffmanTree,
  computeEncodedBitStats,
  generateCodes,
  getCodeLengthDistribution,
  encodeData,
  decodeData,
  serializeTree
};
