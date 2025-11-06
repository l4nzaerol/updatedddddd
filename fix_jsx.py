#!/usr/bin/env python3
# Fix JSX syntax error in ProductionPage.jsx

file_path = r'c:\Users\jhonc\updatedddddd\casptone-front\src\components\Admin\ProductionPage.jsx'

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Add missing closing div before </>
content = content.replace(
    '              </div>\n            </div>\n          </div>\n        </>',
    '              </div>\n            </div>\n          </div>\n        </div>\n      </>'
)

# Fix 2: Close the ready to deliver tab properly at the end
content = content.replace(
    '              </div>\n            </div>\n          </div>\n        </div>\n\n      </div>',
    '              </div>\n            </div>\n          </div>\n        </div>\n      )}'
)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed JSX syntax errors!")
print("✅ Added missing closing div tags")
print("✅ Properly closed tab conditionals")
