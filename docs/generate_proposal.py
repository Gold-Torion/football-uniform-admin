from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

OUTPUT = '/home/dragon/Documents/football_uniform/docs/Arena_dos_Mantos_Feature_Proposal.pdf'

GOLD   = colors.HexColor('#D4AF37')
DARK   = colors.HexColor('#1C2B1D')
GREEN  = colors.HexColor('#335336')
LIGHT  = colors.HexColor('#F4EFE3')
GRAY   = colors.HexColor('#5C5547')
WHITE  = colors.white

doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    leftMargin=2*cm, rightMargin=2*cm,
    topMargin=2*cm, bottomMargin=2*cm,
)

styles = getSampleStyleSheet()

def style(name, **kw):
    s = ParagraphStyle(name, **kw)
    return s

S_TITLE    = style('Title',    fontSize=22, textColor=GOLD,  fontName='Helvetica-Bold', spaceAfter=4, alignment=TA_CENTER)
S_SUBTITLE = style('Sub',      fontSize=11, textColor=GRAY,  fontName='Helvetica',      spaceAfter=2, alignment=TA_CENTER)
S_DATE     = style('Date',     fontSize=9,  textColor=GRAY,  fontName='Helvetica',      spaceAfter=14, alignment=TA_CENTER)
S_H1       = style('H1',       fontSize=13, textColor=GREEN, fontName='Helvetica-Bold', spaceBefore=14, spaceAfter=4)
S_H2       = style('H2',       fontSize=11, textColor=DARK,  fontName='Helvetica-Bold', spaceBefore=8,  spaceAfter=3)
S_BODY     = style('Body',     fontSize=9,  textColor=DARK,  fontName='Helvetica',      spaceAfter=4,  leading=14)
S_BOLD     = style('Bold',     fontSize=9,  textColor=DARK,  fontName='Helvetica-Bold', spaceAfter=4,  leading=14)
S_LABEL    = style('Label',    fontSize=8,  textColor=GRAY,  fontName='Helvetica',      spaceAfter=2)
S_FOOTER   = style('Footer',   fontSize=8,  textColor=GRAY,  fontName='Helvetica',      alignment=TA_CENTER)

def hr(color=GOLD, thickness=1):
    return HRFlowable(width='100%', thickness=thickness, color=color, spaceAfter=8, spaceBefore=4)

def feature_block(num, title, what, why, impl, effort, price):
    items = []
    # Feature header
    items.append(hr(GREEN, 0.5))
    items.append(Paragraph(f'Feature {num} — {title}', S_H1))

    items.append(Paragraph('<b>What it does</b>', S_H2))
    items.append(Paragraph(what, S_BODY))

    items.append(Paragraph('<b>Why it matters</b>', S_H2))
    items.append(Paragraph(why, S_BODY))

    items.append(Paragraph('<b>Implementation</b>', S_H2))
    for line in impl:
        items.append(Paragraph(f'• {line}', S_BODY))

    # Effort + price inline table
    t = Table(
        [[Paragraph('<b>Estimated Effort</b>', S_LABEL), Paragraph('<b>Investment</b>', S_LABEL)],
         [Paragraph(effort, S_BOLD),                     Paragraph(price, S_BOLD)]],
        colWidths=[8*cm, 8*cm],
    )
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), LIGHT),
        ('BACKGROUND', (0,1), (-1,1), WHITE),
        ('BOX',        (0,0), (-1,-1), 0.5, GREEN),
        ('INNERGRID',  (0,0), (-1,-1), 0.5, LIGHT),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    items.append(Spacer(1, 4))
    items.append(t)
    items.append(Spacer(1, 6))
    return items


story = []

# ── Header ────────────────────────────────────────────────────────────────────
story.append(Spacer(1, 0.5*cm))
story.append(Paragraph('Arena dos Mantos', S_TITLE))
story.append(Paragraph('Feature Expansion Proposal — Phase 2 Enhancements', S_SUBTITLE))
story.append(Paragraph('Prepared by Yuri Silva · May 2026', S_DATE))
story.append(hr(GOLD, 2))
story.append(Spacer(1, 0.3*cm))

# ── Introduction ──────────────────────────────────────────────────────────────
story.append(Paragraph('Executive Summary', S_H1))
story.append(Paragraph(
    'Following a competitive analysis of the Brazilian football shirt market — including platforms '
    'such as Alambrado, Brechó do Futebol, and global references like StockX and GOAT — five '
    'high-impact features were identified that would significantly differentiate Arena dos Mantos '
    'from every existing competitor. None of these features overlap with the current contracted scope.',
    S_BODY
))
story.append(Spacer(1, 0.3*cm))

# ── Features ──────────────────────────────────────────────────────────────────
story += feature_block(
    1, 'Verified Authenticity Badge',
    'When a seller lists a Nike, Adidas, or Puma jersey and the SKU passes Google Custom Search '
    'verification, the listing receives a permanent "✓ Verificado" gold badge visible on the feed '
    'card, listing detail screen, and seller profile. Listings that fail verification display a '
    'neutral "Não verificado" label.',
    'No Brazilian competitor offers SKU-level authenticity signaling. This single feature positions '
    'Arena dos Mantos as the only trusted platform for authentic jerseys, directly attacking the '
    'counterfeit problem that frustrates collectors.',
    [
        'Backend: extend SKU lookup endpoint to persist verificationStatus (VERIFIED / UNVERIFIED / NOT_APPLICABLE) on the DynamoDB listing record.',
        'Mobile: render a gold checkmark badge on FeedScreen, ListingDetailScreen, and SellerProfileScreen.',
        'Admin: allow manual override of verification status for edge cases.',
    ],
    '2–3 days', 'R$ 450'
)

story += feature_block(
    2, 'Price History Chart & Market Analytics',
    'Each listing detail page shows an interactive line chart displaying historical transaction '
    'prices for the same jersey (matched by SKU or team + season + supplier + model). Buyers can '
    'see whether the current asking price is fair, above, or below market average.',
    'This is StockX\'s most powerful retention feature. Buyers return repeatedly to monitor price '
    'trends before committing to a purchase. No Brazilian football shirt platform offers this. '
    'It also gives sellers data to price competitively.',
    [
        'Backend: create a PriceHistory GSI on the orders table, keyed by composite jersey fingerprint (teamName#season#supplier#model). Write a price data point on each completed order.',
        'API: GET /listings/:id/price-history returns { date, priceCents } array sorted chronologically.',
        'Mobile: integrate a lightweight chart library (Victory Native or Gifted Charts) on ListingDetailScreen showing min, max, and average price.',
    ],
    '4–5 days', 'R$ 750'
)

story += feature_block(
    3, 'Collector Profile & Showcase',
    'Users who complete a minimum number of verified transactions unlock a "Colecionador" tier badge '
    'on their public profile. Their profile displays a curated showcase grid, a collector score, '
    'and a Follow button so other users are notified when they list new items.',
    'Alambrado built its entire brand around a Guinness World Record collector. Arena dos Mantos '
    'can democratize this — turning every serious collector into a micro-influencer on the platform, '
    'driving organic retention and word-of-mouth.',
    [
        'Backend: add collectorScore and followerCount to the user record. Implement POST/DELETE /users/:id/follow endpoints. Add a follower feed GSI.',
        'Mobile: redesign SellerProfileScreen to include showcase grid, collector badge, and follow button.',
        'Notification: when a followed collector publishes a new listing, send a push notification via Expo Push Notifications to all followers.',
    ],
    '5–6 days', 'R$ 900'
)

story += feature_block(
    4, 'FIFA 2026 Special Catalog',
    'A dedicated in-app section surfaces all jerseys related to the 2026 FIFA World Cup — national '
    'teams, official kits, and limited editions. A World Cup banner appears on the home screen. '
    'Sellers can tag listings as "FIFA 2026" during registration.',
    'Search trend data shows explosive demand for FIFA 2026 merchandise right now. This is a '
    'time-sensitive opportunity — every day without this feature is traffic going to competitors. '
    'The 2026 World Cup is the single largest commercial event in Brazilian football culture.',
    [
        'Backend: add isCopa2026 boolean field to the listing entity and CreateListingDto. Add copa2026 filter to the feed and search endpoints.',
        'Mobile: add "FIFA 2026" toggle on NewListingScreen. Add dedicated Copa2026Screen from home tab banner. Add FIFA 2026 filter chip to SearchScreen.',
        'Admin: allow bulk-tagging of existing listings as FIFA 2026.',
    ],
    '3–4 days', 'R$ 600'
)

story += feature_block(
    5, 'Wishlist & Price Drop Alerts',
    'Buyers can save any listing to a personal wishlist by tapping a heart icon. When the seller '
    'reduces the price of a wishlisted item, the buyer receives a push notification: '
    '"Good news! A jersey on your wishlist dropped from R$249 to R$199."',
    'Users who save items return at a rate 3–5× higher than those who do not. Price drop alerts '
    'create urgency and convert passive browsers into buyers. This is the highest-ROI retention '
    'feature in any marketplace.',
    [
        'Backend: create a Wishlist entity in DynamoDB keyed by USER#:userId → WISH#:listingId. On PATCH /listings/:id/price, query all users who wishlisted this listing and dispatch push notifications.',
        'Mobile: add heart icon to FeedScreen and ListingDetailScreen. Add WishlistScreen to the profile tab. Display price drop delta in the notification payload.',
    ],
    '4–5 days', 'R$ 750'
)

# ── Summary Table ─────────────────────────────────────────────────────────────
story.append(hr(GOLD, 1.5))
story.append(Paragraph('Investment Summary', S_H1))

table_data = [
    ['Feature', 'Effort', 'Investment'],
    ['Verified Authenticity Badge', '2–3 days', 'R$ 450'],
    ['Price History Chart', '4–5 days', 'R$ 750'],
    ['Collector Profile & Showcase', '5–6 days', 'R$ 900'],
    ['FIFA 2026 Special Catalog', '3–4 days', 'R$ 600'],
    ['Wishlist & Price Drop Alerts', '4–5 days', 'R$ 750'],
    ['Total (all 5 features)', '~18 days', 'R$ 3,450'],
]

col_w = [10*cm, 3*cm, 3.5*cm]
t = Table(table_data, colWidths=col_w)
t.setStyle(TableStyle([
    ('BACKGROUND',    (0,0), (-1,0),  DARK),
    ('TEXTCOLOR',     (0,0), (-1,0),  GOLD),
    ('FONTNAME',      (0,0), (-1,0),  'Helvetica-Bold'),
    ('FONTSIZE',      (0,0), (-1,0),  9),
    ('BACKGROUND',    (0,-1),(-1,-1), GREEN),
    ('TEXTCOLOR',     (0,-1),(-1,-1), WHITE),
    ('FONTNAME',      (0,-1),(-1,-1), 'Helvetica-Bold'),
    ('FONTSIZE',      (0,1), (-1,-1), 9),
    ('ROWBACKGROUNDS',(0,1), (-1,-2), [WHITE, LIGHT]),
    ('BOX',           (0,0), (-1,-1), 0.5, GREEN),
    ('INNERGRID',     (0,0), (-1,-1), 0.5, LIGHT),
    ('TOPPADDING',    (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LEFTPADDING',   (0,0), (-1,-1), 8),
    ('ALIGN',         (1,0), (-1,-1), 'CENTER'),
]))
story.append(t)
story.append(Spacer(1, 0.5*cm))

# ── Closing ───────────────────────────────────────────────────────────────────
story.append(Paragraph(
    'Individual features can be contracted separately. Recommended starting point: '
    '<b>Feature 1 (Verified Badge)</b> and <b>Feature 5 (Wishlist)</b> for highest impact per '
    'investment, followed by <b>Feature 4 (FIFA 2026)</b> given tournament calendar urgency. '
    'I am available to begin immediately upon agreement.',
    S_BODY
))
story.append(Spacer(1, 0.8*cm))
story.append(hr(GOLD, 0.5))
story.append(Paragraph('Yuri Silva · Arena dos Mantos · May 2026', S_FOOTER))

doc.build(story)
print(f'PDF generated: {OUTPUT}')
