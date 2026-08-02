import os, re

def update_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements:
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")
    else:
        print(f"No changes for {filepath}")

# 1. Update index.html
index_replacements = [
    # Replace old WhatsApp numbers with 60173569452
    ('wa.me/60108118559', 'wa.me/60173569452'),
    ('010-811 8559', '017-356 9452'),
    ('0108118559', '0173569452'),
]
update_file("index.html", index_replacements)

# Now update agent cards in index.html specifically
with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Replace the agent section grid with 2 agent cards
old_agents_regex = r'<div class="listing-grid" style="grid-template-columns: repeat\(auto-fill, minmax\(280px, 1fr\)\); margin-top: 1rem;">[\s\S]*?<\/div>\s*<\/section>'

new_agents_html = """<div class="listing-grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); max-width: 750px; margin: 1.5rem auto 0 auto; gap: 1.5rem;">

      <!-- Agent 1: WanAzemi -->
      <div class="agent-card">
        <img src="agents/wanazemi.png" class="agent-img" alt="WanAzemi">
        <div class="agent-name">WanAzemi</div>
        <div class="agent-zone">SELANGOR &amp; KUALA LUMPUR ZONES</div>
        <div class="agent-desc">Principal / Senior Industrial Specialist<br>Corporate Estate Malaysia</div>
        <a href="https://wa.me/60173569452" target="_blank" class="btn-whatsapp" style="width: 100%;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.6-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg> WhatsApp 017-356 9452
        </a>
      </div>

      <!-- Agent 2: Aisyah -->
      <div class="agent-card">
        <img src="agents/aisyah.png" class="agent-img" alt="Aisyah">
        <div class="agent-name">Aisyah</div>
        <div class="agent-zone">INDUSTRIAL &amp; COMMERCIAL SPECIALIST</div>
        <div class="agent-desc">Senior Real Estate Consultant<br>Corporate Estate Malaysia</div>
        <a href="https://wa.me/60173790592" target="_blank" class="btn-whatsapp" style="width: 100%;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.6-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg> WhatsApp 017-379 0592
        </a>
      </div>

    </div>
  </section>"""

html = re.sub(old_agents_regex, new_agents_html, html)
with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)
print("Updated agents section in index.html")

# 2. Update about.html, services.html, listings.html, app.js, create_tables.sql, run_sql_api.js
other_files = ["about.html", "services.html", "listings.html", "app.js", "create_tables.sql", "run_sql_api.js"]
general_replacements = [
    ('60108118559', '60173569452'),
    ('6010-811 8559', '017-356 9452'),
    ('0108118559', '0173569452'),
]

for file in other_files:
    if os.path.exists(file):
        update_file(file, general_replacements)
