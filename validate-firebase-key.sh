#!/usr/bin/env bash
# Verify Firebase Service Account Key JSON

echo "=================================================="
echo "Firebase Service Account Key Validator"
echo "=================================================="
echo ""

# Ask user to paste the JSON
echo "Paste your Firebase Service Account JSON (complete the input with Ctrl+D on Unix or Ctrl+Z on Windows):"
echo ""

# Read multi-line input
json_input=""
while IFS= read -r line || [ -n "$line" ]; do
    json_input="$json_input$line"
done

echo ""
echo "=================================================="
echo "Validating JSON structure..."
echo "=================================================="

# Check if it's valid JSON (basic check)
if echo "$json_input" | jq . > /dev/null 2>&1; then
    echo "✅ JSON is VALID!"
    echo ""
    echo "Key details:"
    echo "  Project ID: $(echo "$json_input" | jq -r '.project_id')"
    echo "  Type: $(echo "$json_input" | jq -r '.type')"
    echo "  Email: $(echo "$json_input" | jq -r '.client_email')"
    echo ""
    echo "✅ Ready to add to GitHub secret!"
else
    echo "❌ JSON is INVALID!"
    echo "Please check:"
    echo "  - All quotes are properly closed"
    echo "  - No extra characters"
    echo "  - Starts with { and ends with }"
fi

echo ""
echo "=================================================="
