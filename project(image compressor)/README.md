# Huffman Image Compressor 

A full-stack Design and Analysis of Algorithms (DAA) project implementing an advanced Huffman Coding–based Image Compression System with a modern interactive user interface.

---

## Project Objective

This project demonstrates the practical implementation of the Huffman Coding algorithm for image compression, along with enhancements such as:

* Bit-level encoding
* Custom binary container design
* Adaptive compression strategies
* Real-time compression estimation
* Interactive visualization and analysis

---

## Core Concepts Used

* Greedy Algorithms (Huffman Coding)
* Priority Queue / Min Heap
* Binary Tree Construction
* Bit Manipulation
* Lossless vs Lossy Compression
* Data Encoding and Decoding
* Space-Time Tradeoffs

---

## Key Features

### 1. Accurate Compression Engine

* True bit-level encoding instead of string-based encoding
* Custom binary format: `HUFIMG3`
* Backward compatibility with `HUFIMG1` and `HUFIMG2`

### 2. Multiple Compression Modes

* `lossless-huffman`
* `lossy-huffman`
* `lossy-webp-stored` (fallback for aggressive compression)

---

### 3. Smart Compression Controls

Users can compress images based on:

* Percentage reduction
* Target file size (in KB)
* Quality (0–100)

Backend dynamically adjusts:

* Quantization
* Color reduction (RGB to grayscale when applicable)
* Optional preprocessing such as resizing or blurring

---

### 4. Detailed Compression Statistics

The system provides:

* Original Size
* Encoded Bit Size
* Packed Size
* Metadata Overhead
* Final Output Size
* Compression Ratio
* Space Reduction Percentage

---

### 5. Interactive Visualization (Advanced Analysis)

* Searchable and paginated frequency table
* Huffman tree visualization with zoom and node collapse
* Bit-length distribution chart
* Frequency bar chart
* Merge steps breakdown

---

### 6. Modern User Interface

Built using:

* React with Vite
* Tailwind CSS
* Lucide Icons

Includes:

* Upload panel
* Compression control panel
* Preview panel (original and reconstructed images)
* Difference heatmap
* Progress indicators
* Error handling and validation

---

## Project Structure

```text
DAA PROJECT/
│
├── client/                # Frontend (React + Tailwind)
│   ├── src/components/
│   ├── App.jsx
│   └── ...
│
├── server/               # Backend (Node.js)
│   ├── utils/
│   │   ├── huffman.js
│   │   └── imageCodec.js
│   └── index.js
│
├── package.json
└── README.md
```

---

## API Endpoints

### /api/estimate

* Predicts output size before compression

### /api/compress

* Compresses the image using selected strategy
* Returns statistics, analysis, and compressed data

### /api/decompress

* Reconstructs image from compressed data

### /api/optimize

* Performs additional optimization using WebP or JPEG

---

## How to Run the Project

```bash
npm install
npm run dev
```

### Default Ports:

* Frontend: http://localhost:5173
* Backend: http://localhost:5000

---

## Learning Outcomes

This project demonstrates:

* Practical implementation of Huffman Coding
* Efficient data compression techniques
* Trade-offs between lossless and lossy compression
* Development of a full-stack application
* Visualization of algorithm behavior

---

## Screenshots 
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/074648c6-a199-478a-be3d-b083981d7a35" />

---

## Author

Krishna Yadav
B.Tech Computer Science Engineering

---

## Conclusion

This project connects theoretical algorithm design with practical implementation, showing how Huffman Coding can be extended into a modern and efficient image compression system.
  
