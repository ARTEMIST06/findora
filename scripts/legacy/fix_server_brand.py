with open("server.ts", "r") as f:
    content = f.read()

old_extract = """    // Clean amazon title (e.g. "Buy Apple iPhone 16 Pro (128GB) Online at Best Price - Amazon.in")
    title = title.replace(/Buy\s+/i, '').replace(/\s+Online at Best Price.*/i, '').replace(/\s+at Amazon.*/i, '').replace(/\s*:\s*Amazon.*/i, '');
    
    // Basic Brand extraction (guess from title if it's typical format)
    let brand = '';
    const firstWord = title.split(' ')[0];
    if (firstWord && firstWord.length > 2) {
       brand = firstWord; // Weak guess, but safe
    }"""

new_extract = """    // Clean amazon title
    title = title.replace(/^Amazon\\.[a-z]+:\\s*(Buy\\s+)?/i, '');
    title = title.replace(/Buy\\s+/i, '').replace(/\\s+Online at Best Price.*/i, '').replace(/\\s+at Amazon.*/i, '').replace(/\\s*:\\s*Amazon.*/i, '');
    
    // Basic Brand extraction
    let brand = '';
    const firstWord = title.split(' ')[0];
    if (firstWord && firstWord.length > 2 && firstWord.toLowerCase() !== 'amazon') {
       brand = firstWord;
    }"""

content = content.replace(old_extract, new_extract)

with open("server.ts", "w") as f:
    f.write(content)
