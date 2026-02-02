# Fin Doc Assistant 🤖

An AI-powered document extraction tool that automatically extracts structured data from invoices, receipts, bills, and financial statements using Claude AI.

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF.svg)](https://vitejs.dev/)
[![Claude AI](https://img.shields.io/badge/Claude-Sonnet%204-orange.svg)](https://www.anthropic.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)

## ✨ Features

- **🎯 Multi-Document Support**: Extracts from invoices, receipts, bills, statements, and order confirmations
- **🤖 AI-Powered Extraction**: Uses Claude Sonnet 4 for high-accuracy document analysis
- **📊 Confidence Scoring**: AI-generated confidence scores for each extracted field
- **✏️ Manual Review**: Edit any extracted field before export
- **📈 Cost Tracking**: Real-time tracking of API usage costs
- **📚 History**: Local storage of past extractions for easy reference
- **🎨 Modern UI**: Clean, responsive interface built with React and Tailwind CSS

## 🏗️ Architecture

Invoice Assistant uses a **multi-agent architecture** with specialized AI agents:

```
Upload → Extract Agent → Validation Agent → Score Agent → Review
         (Claude Sonnet)  (Business Rules)  (Claude Haiku)
```

### Agent Pipeline

1. **Extract Agent**: Analyzes document images and extracts structured data with document-type-specific logic
2. **Validation Agent**: Validates extracted data against business rules
3. **Score Agent**: Generates confidence scores and reasoning for each field

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed design documentation.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/invoice-assistant.git
cd invoice-assistant

# Install dependencies
npm install

# Set up environment variables
# Create .env file and add your API key
echo "VITE_ANTHROPIC_API_KEY=your_api_key_here" > .env

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🎯 Usage

1. **Upload Document**: Drag & drop or click to upload an invoice/receipt image
2. **Processing**: AI agents automatically extract and validate data
3. **Review**: Check extracted fields with confidence scores
4. **Edit**: Manually correct any fields if needed
5. **Export**: Save or export the structured data

## 🏛️ Design Decisions

### Hybrid Single-Agent Architecture
We use a single extraction agent with document-type-specific logic rather than multiple specialist agents. This provides:
- ✅ Lower latency (1 API call vs 2+)
- ✅ Simpler architecture for MVP
- ✅ Cost effectiveness
- ✅ Good accuracy (95%+ on quality documents)

See [ADR-001](docs/adr/0001-agent-architecture.md) for full analysis.

### Document-Type-Specific Rules
Instead of vendor-specific rules, we use universal document patterns:
- **Retail Receipts**: Order # → Receipt # → Transaction ID
- **Invoices**: Invoice # → Reference #
- **Bills**: Account # → Bill #

This scales across all vendors following standard formats. See [ADR-002](docs/adr/0002-document-type-rules.md) for rationale.

## 📂 Project Structure

```
src/
├── services/           # AI agents and business logic
│   ├── claudeService.js       # Extract & Score agents
│   ├── validationService.js   # Validation agent
│   ├── orchestrator.js        # Agent pipeline coordinator
│   ├── formatService.js       # Data formatting utilities
│   ├── storageService.js      # LocalStorage management
│   └── logger.js              # Error logging
├── components/         # Reusable UI components
├── pages/             # Route pages (Home, Processing, Review, History)
└── utils/             # Helper functions

docs/
├── adr/               # Architecture Decision Records
├── ARCHITECTURE.md    # System design documentation
└── CHANGELOG.md       # Version history
```

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, React Router, Tailwind CSS
- **AI/ML**: Claude Sonnet 4 (extraction), Claude Haiku 4 (scoring)
- **Storage**: LocalStorage (demo), migrate to database for production
- **APIs**: Anthropic SDK

## 📊 Performance

- **Latency**: ~2-4 seconds for full pipeline
- **Cost**: ~$0.01-0.03 per document
- **Accuracy**: ~95%+ on high-quality documents

## 🔒 Security Notes

⚠️ **Current implementation is for demo/portfolio purposes:**
- API keys exposed in browser (use backend proxy for production)
- No authentication/authorization
- Client-side storage only

**For production use**: Migrate API calls to secure backend, add authentication, use database storage.

## 🚧 Roadmap

- [ ] Backend API migration for security
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Multi-page document support
- [ ] PDF extraction (not just images)
- [ ] Batch processing
- [ ] Export to accounting systems (QuickBooks, Xero)
- [ ] Real-time collaboration

## 📚 Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System design and philosophy
- [CHANGELOG.md](CHANGELOG.md) - Version history and changes
- [ADR Directory](docs/adr/) - Architecture decision records
- [ADR-001](docs/adr/0001-agent-architecture.md) - Agent architecture choice
- [ADR-002](docs/adr/0002-document-type-rules.md) - Document-type vs vendor-specific rules

## 🤝 Contributing

Contributions are welcome! When making architectural changes:
1. Document decision in a new ADR (`docs/adr/`)
2. Update ARCHITECTURE.md
3. Update CHANGELOG.md
4. Add inline code comments referencing the ADR

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [Claude AI](https://www.anthropic.com/) by Anthropic
- UI powered by [Tailwind CSS](https://tailwindcss.com/)
- Built with [Vite](https://vitejs.dev/) and [React](https://react.dev/)

---

**Portfolio Project** | Built to demonstrate AI agent architecture and document processing | [Live Demo](#) | [GitHub](https://github.com/yourusername/invoice-assistant)

