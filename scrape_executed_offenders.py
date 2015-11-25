from bs4 import BeautifulSoup
import requests
import time
import json

############################################################################################################
# Special thanks to Matthew Phillips (https://gist.github.com/phillipsm/404780e419c49a5b62a8) for the help #
############################################################################################################

url_to_scrape = "https://www.tdcj.state.tx.us/death_row/dr_executed_offenders.html"

url_to_offender_info = "https://www.tdcj.state.tx.us/death_row/"

r = requests.get(url_to_scrape)

soup = BeautifulSoup(r.text)

inmates_links = []

for table_row in soup.select(".os tr"):

	table_cells = table_row.findAll("td")
	if len(table_cells) > 0:

		#find the execution number
		execution_number = table_cells[0].text

		#find link to details for each inmate
		link_to_inmate_details = table_cells[1].find('a')['href']
		absolute_link1 = url_to_offender_info + link_to_inmate_details
		
		#find link to last statement for each inmate
		link_to_inmate_last_statement = table_cells[2].find('a')['href']
		absolute_link2 = url_to_offender_info + link_to_inmate_last_statement
		#append both links to be one tuple in the array
		inmates_links.append([execution_number, absolute_link1, absolute_link2])

all_executed_offenders_Texas = []

for inmate_link in inmates_links:

	# put the details in dictionary
	inmate_details = {}

	#extract the links from the array, list or what ever
	inmate_details['Execution_number'] = inmate_link[0]
	firstLink = inmate_link[1]
	secondLink = inmate_link[2]

	if firstLink:
			if "jpg" not in firstLink:

					r = requests.get(firstLink)
					soup = BeautifulSoup(r.text)

					inmate_profile_rows = soup.select(".tabledata_deathrow_table tr")

					inmate_profile_span = soup.select("p")

					inmate_photo = "https://www.tdcj.state.tx.us/death_row/dr_info/"

					#Info from td elements
					try:
						inmate_details['Photo'] = inmate_photo + inmate_profile_rows[0].findAll('td')[0].find('img')['src']
					except:
						inmate_details['Photo'] = "Photo not available"
					inmate_details['Name'] = inmate_profile_rows[0].findAll('td')[2].text.encode('utf-8').strip()
					inmate_details['TDCJ_Number'] = inmate_profile_rows[1].findAll('td')[1].text.encode('utf-8').strip()
					inmate_details['Date_of_birth'] = inmate_profile_rows[2].findAll('td')[1].text.encode('utf-8').strip()
					inmate_details['Date_received'] = inmate_profile_rows[3].findAll('td')[1].text.encode('utf-8').strip()
					inmate_details['Age_when_received'] = inmate_profile_rows[4].findAll('td')[1].text.encode('utf-8').strip()
					inmate_details['Education_level'] = inmate_profile_rows[5].findAll('td')[1].text.encode('utf-8').strip()
					inmate_details['Date_of_offence'] = inmate_profile_rows[6].findAll('td')[1].text.encode('utf-8').strip()
					inmate_details['Age_of_offence'] = inmate_profile_rows[7].findAll('td')[2].text.encode('utf-8').strip()
					inmate_details['County'] = inmate_profile_rows[8].findAll('td')[2].text.encode('utf-8').strip()
					inmate_details['Race'] = inmate_profile_rows[9].findAll('td')[2].text.encode('utf-8').strip()
					inmate_details['Gender'] = inmate_profile_rows[10].findAll('td')[2].text.encode('utf-8').strip()
					inmate_details['Hair_color'] = inmate_profile_rows[11].findAll('td')[2].text.encode('utf-8').strip()
					inmate_details['Height'] = inmate_profile_rows[12].findAll('td')[2].text.encode('utf-8').strip()
					inmate_details['Weight'] = inmate_profile_rows[13].findAll('td')[2].text.encode('utf-8').strip()
					inmate_details['Eye_color'] = inmate_profile_rows[14].findAll('td')[2].text.encode('utf-8').strip()
					inmate_details['Native_county'] = inmate_profile_rows[15].findAll('td')[2].text.encode('utf-8').strip()
					inmate_details['Native_state'] = inmate_profile_rows[16].findAll('td')[2].text.encode('utf-8').strip()
					
					#Info from span elements
					try: 
						inmate_details['Prior_occupation'] = inmate_profile_span[1].text.encode('utf-8').strip().splitlines()[1]
					except IndexError:
						inmate_details['Prior_occupation'] = "no info"

					try:
						inmate_details['Prior_prision_record'] = inmate_profile_span[2].text.encode('utf-8').strip().splitlines()[1]
					except IndexError:
						inmate_details['Prior_prision_record'] = 'no info'

					try:
						inmate_details['Summary_of_incedent'] = inmate_profile_span[3].text.encode('utf-8').strip().splitlines()[1]
					except IndexError:
						inmate_details['Summary_of_incedent'] = 'no info'

					try:
						inmate_details['Co_defendants'] = inmate_profile_span[4].text.encode('utf-8').strip().splitlines()[1]
					except IndexError:
						inmate_details['Co_defendants'] = "no info"

					try:
						inmate_details['Race_and_gender_of_victim'] = inmate_profile_span[5].text.encode('utf-8').strip().splitlines()[1]
					except IndexError:
						inmate_details['Race_and_gender_of_victim'] = "no info"

			else:
				#sometimes the information is in jpg format
				print "Can't read this: " + firstLink
				inmate_details["Can't be read"] = firstLink

			time.sleep(1)

	if secondLink:
			if "jpg" not in secondLink:
					r = requests.get(secondLink)
					soup = BeautifulSoup(r.text)

					inmate_profile_span = soup.select("p")

					#Info from span elements
					try: 
						inmate_details['Date_of_execution'] = inmate_profile_span[2].text.encode('utf-8').strip()
					except IndexError:
						inmate_details['Date_of_execution'] = "no info"

					try: 
						inmate_details['Offender'] = inmate_profile_span[4].text.encode('utf-8').strip()
					except IndexError:
						inmate_details['Offender'] = "no info"

					try:
						inmate_details['Last_statement'] = inmate_profile_span[6].text.encode('utf-8').strip()
					except IndexError:
						inmate_details['Last_statement'] = 'no info'

			else:
				print "Can't read this: " + secondLink
				inmate_details["Can't be read"] = secondLink

			time.sleep(1)

	all_executed_offenders_Texas.append(inmate_details)

#print all_executed_offenders_Texas
#json.dump has to be outside the loop because otherwise the array will write the first object, then the first and the second, then the first...os.fv.
with open("inmates_info.json", "a") as json_file:
	json.dump(all_executed_offenders_Texas, json_file, indent = 4, separators=(',', ': '), sort_keys = True, ensure_ascii=False)

print "All done writing to file"

