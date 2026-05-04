from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import all models here so Alembic / create_all picks them up
# from app.models.document import Document       # noqa: F401, E402
# from app.models.comment import Comment         # noqa: F401, E402
# from app.models.vote import Vote               # noqa: F401, E402
# from app.models.version import Version         # noqa: F401, E402
# from app.models.change import Change           # noqa: F401, E402
# from app.models.notification import Notification  # noqa: F401, E402
