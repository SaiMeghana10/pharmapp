import { useEffect, useRef, useState } from "react";
import {
  SQLiteDBConnection,
  SQLiteConnection,
  CapacitorSQLite,
} from "@capacitor-community/sqlite";

const useSQLiteDB = () => {
  const db = useRef<SQLiteDBConnection>();
  const sqlite = useRef<SQLiteConnection>();
  const [initialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    const initializeDB = async () => {
      if (sqlite.current) return;

      sqlite.current = new SQLiteConnection(CapacitorSQLite);
      const ret = await sqlite.current.checkConnectionsConsistency();
      const isConn = (await sqlite.current.isConnection("db_vite", false)).result;

      if (ret.result && isConn) {
        db.current = await sqlite.current.retrieveConnection("db_vite", false);
      } else {
        db.current = await sqlite.current.createConnection(
          "db_vite",
          false,
          "no-encryption",
          1,
          false
        );
      }

      await initializeTables();
      setInitialized(true);
    };

    initializeDB();
  }, []);

  const performSQLAction = async (
    action: (db: SQLiteDBConnection | undefined) => Promise<void>,
    cleanup?: () => Promise<void>
  ) => {
    try {
      await db.current?.open();
      await action(db.current);
    } catch (error) {
      if ((error as Error).message.includes("UNIQUE constraint failed")) {
        alert("A medicine with this name already exists. Please use a different name.");
      } else {
        alert((error as Error).message);
      }
    } finally {
      try {
        (await db.current?.isDBOpen())?.result && (await db.current?.close());
        cleanup && (await cleanup());
      } catch {}
    }
  };

  const initializeTables = async () => {
    performSQLAction(async (db: SQLiteDBConnection | undefined) => {
      const queryCreateMedicinesTable = `
        CREATE TABLE IF NOT EXISTS medicines (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE,
          type TEXT,
          quantity TEXT,
          expiry_date TEXT,
          batch_no TEXT,
          price REAL
        );
      `;

      const queryCreateGeneralItemsTable = `
        CREATE TABLE IF NOT EXISTS general_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          quantity TEXT,
          price REAL
        );
      `;

      const queryCreateExpiredItemsTable = `
        CREATE TABLE IF NOT EXISTS expired_items (
          id INTEGER PRIMARY KEY,
          name TEXT,
          type TEXT,
          quantity TEXT,
          expiry_date TEXT,
          batch_no TEXT,
          price REAL
        );
      `;

      await db?.execute(queryCreateMedicinesTable);
      await db?.execute(queryCreateGeneralItemsTable);
      await db?.execute(queryCreateExpiredItemsTable);

      console.log("Tables created successfully.");
    });
  };

  return { performSQLAction, initialized };
};

export default useSQLiteDB;
