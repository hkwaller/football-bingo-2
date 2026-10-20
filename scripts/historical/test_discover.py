import unittest
from discover import parse_page

class DiscoveryTests(unittest.TestCase):
    def test_duplicate_links_preserve_two_teams_and_match_context(self):
        p = parse_page('''<h1>All finals</h1><select name="saison_id"><option value="2007">07/08</option></select>
        <table><tr><td>07/08</td><td><a href="/home/verein/1" title="Home">Home</a><a href="/home/verein/1">badge</a></td>
        <td><a href="/spielbericht/index/spielbericht/99">1:0</a></td><td><a href="/away/verein/2" title="Away">Away</a></td></tr></table>''')
        self.assertEqual(p['matches'][0]['id'], '99')
        self.assertEqual(len(p['matches'][0]['teams']), 2)
        self.assertEqual(p['filters'][0]['options'][0]['value'], '2007')
    def test_challenge_is_not_an_empty_table(self):
        with self.assertRaises(ValueError): parse_page('<h1>JavaScript is disabled</h1>We need to verify that you are not a robot')
    def test_empty_recognized_table_is_distinct(self):
        self.assertEqual(parse_page('<h1>Penalty shoot-out</h1><table></table>')['matches'], [])

if __name__ == '__main__': unittest.main()
