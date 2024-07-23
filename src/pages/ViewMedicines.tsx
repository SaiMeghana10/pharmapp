import {
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonContent,
  IonItem,
  IonButton,
  IonLabel,
  IonInput,
  IonCol,
  IonRow,
  IonGrid,
  IonFooter,
  IonText,
} from "@ionic/react";
import React, { useEffect, useState } from "react";
import { SQLiteDBConnection } from "@capacitor-community/sqlite";
import useSQLiteDB from "../composables/useSQLiteDB";
import useConfirmationAlert from "../composables/useConfirmationAlert";

type MedicineItem = {
  id: number;
  name: string;
  type: string;
  quantity: string;
  expiry_date: string;
  batch_no: string;
  price: number;
};

const ViewMedicines: React.FC = () => {
  const [items, setItems] = useState<Array<MedicineItem>>([]);
  const [expiredItems, setExpiredItems] = useState<Array<MedicineItem>>([]);
  const [editItem, setEditItem] = useState<MedicineItem | undefined>();
  const [inputName, setInputName] = useState("");
  const [inputType, setInputType] = useState("");
  const [inputQuantity, setInputQuantity] = useState("");
  const [inputExpiryDate, setInputExpiryDate] = useState("");
  const [inputBatchNo, setInputBatchNo] = useState("");
  const [inputPrice, setInputPrice] = useState<number | undefined>();

  const { performSQLAction, initialized } = useSQLiteDB();
  const { showConfirmationAlert, ConfirmationAlert } = useConfirmationAlert();

  useEffect(() => {
    if (initialized) {
      loadData();
    }
  }, [initialized]);

  const loadData = async () => {
    try {
      await performSQLAction(async (db: SQLiteDBConnection | undefined) => {
        const currentDate = new Date().toISOString().split('T')[0];
        
        const respSelect = await db?.query(`SELECT * FROM medicines`);
        const allItems = respSelect?.values || [];

        const nonExpiredItems = allItems.filter((item: MedicineItem) => item.expiry_date >= currentDate);
        const expiredItems = allItems.filter((item: MedicineItem) => item.expiry_date < currentDate);

        setItems(nonExpiredItems);
        setExpiredItems(expiredItems);

        await moveExpiredItems(expiredItems, db);
        await db?.query(`DELETE FROM medicines WHERE expiry_date < ?;`, [currentDate]);
      });
    } catch (error) {
      alert((error as Error).message);
      setItems([]);
    }
  };

  const moveExpiredItems = async (expiredItems: Array<MedicineItem>, db: SQLiteDBConnection | undefined) => {
    for (const item of expiredItems) {
      await db?.query(
        `INSERT INTO expired_items (id, name, type, quantity, expiry_date, batch_no, price) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [item.id, item.name, item.type, item.quantity, item.expiry_date, item.batch_no, item.price]
      );
    }
  };

  const updateItem = async () => {
    if (!editItem) return;

    try {
      await performSQLAction(
        async (db: SQLiteDBConnection | undefined) => {
          await db?.query(
            `UPDATE medicines SET name=?, type=?, quantity=?, expiry_date=?, batch_no=?, price=? WHERE id=?`,
            [
              inputName,
              inputType,
              inputQuantity,
              inputExpiryDate,
              inputBatchNo,
              inputPrice,
              editItem.id,
            ]
          );

          const respSelect = await db?.query(`SELECT * FROM medicines;`);
          setItems(respSelect?.values || []);
        },
        async () => {
          resetInputs();
        }
      );
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const deleteItem = async (itemId: number) => {
    try {
      await performSQLAction(
        async (db: SQLiteDBConnection | undefined) => {
          await db?.query(`DELETE FROM medicines WHERE id=?;`, [itemId]);

          const respSelect = await db?.query(`SELECT * FROM medicines;`);
          setItems(respSelect?.values || []);
        }
      );
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const confirmDelete = (itemId: number) => {
    showConfirmationAlert("Are You Sure You Want To Delete This Item?", () => {
      deleteItem(itemId);
    });
  };

  const doEditItem = (item: MedicineItem | undefined) => {
    if (item) {
      setEditItem(item);
      setInputName(item.name);
      setInputType(item.type);
      setInputQuantity(item.quantity);
      setInputExpiryDate(item.expiry_date);
      setInputBatchNo(item.batch_no);
      setInputPrice(item.price);
    } else {
      resetInputs();
    }
  };

  const resetInputs = () => {
    setEditItem(undefined);
    setInputName("");
    setInputType("");
    setInputQuantity("");
    setInputExpiryDate("");
    setInputBatchNo("");
    setInputPrice(undefined);
  };

  return (
    <IonPage>
      <IonHeader className='headercls'>
        
          View Medicines
       
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonGrid>
          <IonRow className='titles'>
            <IonCol className='tablecol'>S.No</IonCol>
            <IonCol className='tablecol'>Name</IonCol>
            <IonCol className='tablecol'>Type</IonCol>
            <IonCol className='tablecol'>Quantity</IonCol>
            <IonCol className='tablecol'>Expiry Date</IonCol>
            <IonCol className='tablecol'>Batch No</IonCol>
            <IonCol className='tablecol'>Price</IonCol>
            <IonCol className='tablecol'>Edit</IonCol>
            <IonCol className='tablecol'>Delete</IonCol>
          </IonRow>
          {items?.map((item, index) => (
            <IonRow key={item.id}>
              <IonCol className='tablecol'>{index + 1}</IonCol>
              <IonCol className='tablecol'>{item.name}</IonCol>
              <IonCol className='tablecol'>{item.type}</IonCol>
              <IonCol className='tablecol'>{item.quantity}</IonCol>
              <IonCol className='tablecol'>{item.expiry_date}</IonCol>
              <IonCol className='tablecol'>{item.batch_no}</IonCol>
              <IonCol className='tablecol'>{item.price}</IonCol>
              <IonCol className='tablecol'>
                <IonButton color="light" onClick={() => doEditItem(item)}>EDIT</IonButton>
              </IonCol>
              <IonCol className='tablecol'>
                <IonButton color="light" onClick={() => confirmDelete(item.id)}>DELETE</IonButton>
              </IonCol>
            </IonRow>
          ))}
        </IonGrid>

        <h2>Expired Medicines</h2>
        <IonGrid>
          <IonRow className='titles'>
            <IonCol className='tablecol'>S.No</IonCol>
            <IonCol className='tablecol'>Name</IonCol>
            <IonCol className='tablecol'>Type</IonCol>
            <IonCol className='tablecol'>Quantity</IonCol>
            <IonCol className='tablecol'>Expiry Date</IonCol>
            <IonCol className='tablecol'>Batch No</IonCol>
            <IonCol className='tablecol'>Price</IonCol>
          </IonRow>
          {expiredItems?.map((item, index) => (
            <IonRow key={item.id}>
              <IonCol className='tablecol'>{index + 1}</IonCol>
              <IonCol className='tablecol'>{item.name}</IonCol>
              <IonCol className='tablecol'>{item.type}</IonCol>
              <IonCol className='tablecol'>{item.quantity}</IonCol>
              <IonCol className='tablecol'>{item.expiry_date}</IonCol>
              <IonCol className='tablecol'>{item.batch_no}</IonCol>
              <IonCol className='tablecol'>{item.price}</IonCol>
            </IonRow>
          ))}
        </IonGrid>

        {editItem && (
          <>
            <IonItem className="itemcls">
              <IonLabel className="labelcls">Name</IonLabel>
              <IonInput
                type="text"
                value={inputName}
                onIonChange={(e) => setInputName(e.detail.value!)}
              />
            </IonItem>
            <IonItem className="itemcls">
              <IonLabel className="labelcls">Type</IonLabel>
              <IonInput
                type="text"
                value={inputType}
                onIonChange={(e) => setInputType(e.detail.value!)}
              />
            </IonItem>
            <IonItem className="itemcls">
              <IonLabel className="labelcls">Quantity</IonLabel>
              <IonInput
                type="text"
                value={inputQuantity}
                onIonChange={(e) => setInputQuantity(e.detail.value!)}
              />
            </IonItem>
            <IonItem className="itemcls">
              <IonLabel className="labelcls">Expiry Date</IonLabel>
              <IonInput
                type="date"
                value={inputExpiryDate}
                onIonChange={(e) => setInputExpiryDate(e.detail.value!)}
              />
            </IonItem>
            <IonItem className="itemcls">
              <IonLabel className="labelcls">Batch No</IonLabel>
              <IonInput
                type="text"
                value={inputBatchNo}
                onIonChange={(e) => setInputBatchNo(e.detail.value!)}
              />
            </IonItem>
            <IonItem className="itemcls">
              <IonLabel className="labelcls">Price (Rs.)</IonLabel>
              <IonInput
                type="number"
                value={inputPrice}
                onIonChange={(e) => setInputPrice(Number(e.detail.value!))}
              />
            </IonItem>
            <IonButton expand="full" onClick={updateItem}>Update</IonButton>
          </>
        )}

        {ConfirmationAlert}
      </IonContent>
      <IonFooter className='footer'>
        <IonText>Contact Us : 9010203040</IonText>
        <IonText>Email : abc@gmail.com</IonText>
      </IonFooter>
    </IonPage>
  );
};

export default ViewMedicines;
