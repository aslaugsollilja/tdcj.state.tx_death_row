from bs4 import BeautifulSoup
import requests
import time
import json

############################################################################################################
# Special thanks to Matthew Phillips (https://gist.github.com/phillipsm/404780e419c49a5b62a8) for the help #
############################################################################################################

url_to_scrape = "https://www.tdcj.state.tx.us/death_row/dr_executions_by_year.html"

r = requests.get(url_to_scrape)

soup = BeautifulSoup(r.text)

totalExecutionsByYear = []

for table_row in soup.select(".os tr"):

	year_static = {}

	table_headers = table_row.find("th")
	table_cells = table_row.findAll("td")
	
	if len(table_cells) > 0:

				#Info from td and th elements
				year_static['Year'] = table_headers.text.encode('utf-8').strip()
				year_static['White'] = table_cells[0].text.encode('utf-8').strip()
				year_static['Black'] = table_cells[2].text.encode('utf-8').strip()
				year_static['Hispanic'] = table_cells[4].text.encode('utf-8').strip()
				year_static['Other'] = table_cells[6].text.encode('utf-8').strip()
				year_static['Total'] = table_cells[8].text.encode('utf-8').strip()

	totalExecutionsByYear.append(year_static)

with open("executions_by_year.json", "a") as json_file:
	json.dump(totalExecutionsByYear, json_file, indent = 4, separators=(',', ': '), ensure_ascii=False)

print "All done writing to file"

