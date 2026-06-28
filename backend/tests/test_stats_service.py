from datetime import date
from decimal import Decimal

from app.repositories import StatsRepository
from app.services import StatsService


def test_stats_service_summarizes_user_wardrobe(db_session, user, make_garment, make_outfit):
    shirt = make_garment(category="top", color_name="White", color_hex="#ffffff")
    trousers = make_garment(category="bottom", color_name="Navy", color_hex="#1f2a44")
    make_garment(category="top", color_name="White", color_hex="#ffffff")
    make_outfit(garments=[shirt, trousers])
    service = StatsService(StatsRepository(db_session))

    summary = service.summary(user.id)

    assert summary.total_garments == 3
    assert summary.total_outfits == 1
    assert summary.category_breakdown[0].category == "top"
    assert summary.category_breakdown[0].total == 2
    assert summary.category_breakdown[0].colors[0].color_name == "White"
    assert summary.category_breakdown[0].colors[0].count == 2


def test_stats_service_spending_colors_materials_and_time(db_session, user, make_garment):
    make_garment(
        category="top",
        color_name="White",
        color_hex="#ffffff",
        purchase_price=Decimal("50.00"),
        purchase_date=date(2026, 1, 15),
        material=[{"material": "linen", "pct": 100}],
    )
    make_garment(
        category="shoes",
        color_name="Black",
        color_hex="#111111",
        purchase_price=Decimal("120.00"),
        purchase_date=date(2026, 1, 20),
        material=[{"material": "leather", "pct": 100}],
    )
    service = StatsService(StatsRepository(db_session))

    spending = service.spending_by_category(user.id, date(2026, 1, 1), date(2026, 1, 31))
    colors = service.colors(user.id)
    materials = service.materials(user.id)
    points = service.spending_over_time(user.id, "month", date(2026, 1, 1), date(2026, 12, 31))

    assert [(row.category, row.total_spent) for row in spending] == [
        ("shoes", Decimal("120.00")),
        ("top", Decimal("50.00")),
    ]
    assert {row.color_name for row in colors} == {"White", "Black"}
    assert {row.material for row in materials} == {"linen", "leather"}
    assert points[0].period == date(2026, 1, 1)
    assert points[0].total_spent == Decimal("170.00")
